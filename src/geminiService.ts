// Simplified Gemini Service using backend endpoints
import { ExplainBackAnalysis, GeneratedLesson, KnowledgeLevel, LearningGoal, ExternalLabTool, GeneratedRoadmap, AppLanguage, PracticeQuestion, StudySource, GeneratedStudyMaterials, MindNode, Flashcard, MasteryPath, MasteryTask, QuizAnalysis } from "../types";
import { storage } from '../utils/storage';
import { LAB_TOOLS } from "../data/labTools";
import { getLocalizedValue } from "../utils/languageUtils";
import { parseJsonLoose } from "../utils/jsonParse";


const getApiKey = () => {
  // Key is now handled on the server.
  return 'INTERNAL';
};

const getLanguage = (): 'uz' | 'en' | 'ru' => {
  const saved = storage.get('idrok-language');
  return (saved === 'en' || saved === 'ru') ? saved : 'uz';
};

const getLangInstruction = () => {
  const lang = getLanguage();
  if (lang === 'en') return "STRICTLY ENGLISH";
  if (lang === 'ru') return "STRICTLY RUSSIAN";
  return "STRICTLY UZBEK (Latin script)";
};

const t = (key: string) => {
  const lang = getLanguage();
  const map: Record<string, { en: string, ru: string, uz: string }> = {
    "api_key_missing": { en: "API Key missing.", ru: "Отсутствует ключ API.", uz: "API Kaliti yetishmayapti." },
    "voice_error": { en: "Voice generation error.", ru: "Ошибка генерации голоса.", uz: "Ovoz yaratishda xatolik." },
    "audio_not_created": { en: "Audio not created.", ru: "Аудио не создано.", uz: "Audio yaratilmadi." },
    "content_error": { en: "Error generating content.", ru: "Ошибка создания контента.", uz: "Tarkib yaratishda xatolik yuz berdi." },
    "policy_error": { en: "Topic violates safety policy.", ru: "Тема нарушает политику безопасности.", uz: "Ushbu mavzu bizning xavfsizlik qoidalarimizga to'g'ri kelmaydi." },
    "connection_error": { en: "Connection error. Please try again.", ru: "Ошибка подключения. Попробуйте снова.", uz: "Ulanishda xatolik. Iltimos, qayta urinib ko'ring." },
    "empty_response": { en: "Empty response.", ru: "Пустой ответ.", uz: "Bo'sh javob" },
    "generic_error": { en: "An error occurred.", ru: "Произошла ошибка.", uz: "Xatolik yuz berdi" },
    "explanation_failed": { en: "Could not generate explanation.", ru: "Не удалось создать объяснение.", uz: "Tushuntirish yaratib bo'lmadi." },
    "ai_connection_error": { en: "AI connection error.", ru: "Ошибка подключения к ИИ.", uz: "Sun'iy intellektga ulanishda xatolik." },
    "gemini_key_invalid": { en: "Gemini API key is invalid.", ru: "Ключ Gemini неверный.", uz: "Gemini API kaliti noto'g'ri." },
  };
  return map[key]?.[lang] || map[key]?.['en'] || key;
};

const isInvalidApiKey = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  const raw = JSON.stringify(error || {});
  return message.includes('API key not valid') || raw.includes('API_KEY_INVALID') || raw.includes('API key not valid');
};

const reportUsage = (data: any, modelName: string = 'gemini-3.1-flash', label?: string, textFallback?: string) => {
  if (!GeminiService.tokenListener) return;

  // 1. Try to get real usage from response data
  const usage = data?.usage || data?.usageMetadata || (data?.totalTokenCount ? data : null);
  if (usage) {
    GeminiService.tokenListener({
      total: usage.totalTokenCount || usage.total_tokens || 0,
      input: usage.promptTokenCount || usage.prompt_tokens || 0,
      output: usage.candidatesTokenCount || usage.completion_tokens || 0,
      model: modelName,
      label: label
    });
    return;
  }

  // 2. Fallback to estimation if text is provided
  if (textFallback) {
    // Rough estimation: 1 token ~= 4 chars for English/Uzbek mix
    const outputTokens = Math.ceil(textFallback.length / 4);
    const inputTokens = 500; // Average prompt overhead
    GeminiService.tokenListener({
      total: inputTokens + outputTokens,
      input: inputTokens,
      output: outputTokens,
      model: modelName,
      label: label
    });
  }
};

// Fallback logic to ensure we NEVER return undefined

const getFallbackTool = (topic: string): ExternalLabTool | undefined => {
  // 1. Try simple keyword matching
  const lowerTopic = topic.toLowerCase();
  const lang = getLanguage();
  const keywordMatch = LAB_TOOLS.find(t => {
    const titleValue = getLocalizedValue(t.title, lang).toLowerCase();
    return titleValue.includes(lowerTopic) ||
      t.tags.some(tag => lowerTopic.includes(tag.toLowerCase()));
  });

  if (keywordMatch) return keywordMatch;

  return undefined;
};

const buildFallbackLesson = (
  topic: string, level: KnowledgeLevel, goal: LearningGoal, rawText?: string
): GeneratedLesson => {
  const lang = getLanguage();
  const placeholderContent = lang === 'en'
    ? `Content for "${topic}" could not be fully loaded. Please try again.`
    : lang === 'ru'
      ? `Контент по теме "${topic}" не удалось полностью загрузить. Попробуйте снова.`
      : `"${topic}" mavzusi bo'yicha tarkib to'liq yuklanmadi. Iltimos qayta urinib ko'ring.`;

  if (!rawText?.trim()) {
    return {
      topic, level, goal,
      sections: [{ title: topic, content: placeholderContent, type: 'concept' as const }],
      vocabulary: [], sources: [],
    };
  }

  // Try to deeply extract lesson data from the raw text
  const tryExtractLesson = (text: string): GeneratedLesson | null => {
    let parsed: any;
    try {
      // First try parseJsonLoose (which handles markdown fences, escape issues, etc.)
      parsed = parseJsonLoose(text);
    } catch { /* ignore */ }
    if (!parsed) {
      try { parsed = JSON.parse(text); } catch { /* ignore */ }
    }
    if (!parsed || typeof parsed !== 'object') return null;

    // The AI may nest sections at various depths:
    // { sections: [...] }
    // { lesson: { sections: [...] } }
    // { content: { sections: [...] } }
    // { data: { sections: [...] } }
    const findSections = (obj: any, depth = 0): any[] | null => {
      if (depth > 3) return null;
      if (Array.isArray(obj?.sections) && obj.sections.length > 0) return obj.sections;
      for (const key of ['lesson', 'content', 'data', 'result', 'response']) {
        if (obj?.[key] && typeof obj[key] === 'object') {
          const found = findSections(obj[key], depth + 1);
          if (found) return found;
        }
      }
      return null;
    };

    const sections = findSections(parsed);
    if (!sections || sections.length === 0) return null;

    // Normalize extracted sections
    const normalizedSections = sections.map((s: any, i: number) => {
      const content = s?.content || s?.text || s?.body || s?.description || '';
      const title = s?.title || `Section ${i + 1}`;
      const type = s?.type || 'concept';
      return { ...s, title, content, type };
    }).filter((s: any) => typeof s.content === 'string' && s.content.trim().length > 0);

    if (normalizedSections.length === 0) return null;

    // Find topic/vocabulary/sources from whatever nesting level has them
    const findField = (obj: any, field: string, depth = 0): any => {
      if (depth > 3) return undefined;
      if (obj?.[field] !== undefined) return obj[field];
      for (const key of ['lesson', 'content', 'data', 'result', 'response']) {
        if (obj?.[key] && typeof obj[key] === 'object') {
          const found = findField(obj[key], field, depth + 1);
          if (found !== undefined) return found;
        }
      }
      return undefined;
    };

    return {
      topic: findField(parsed, 'topic') || topic,
      level, goal,
      sections: normalizedSections,
      vocabulary: Array.isArray(findField(parsed, 'vocabulary')) ? findField(parsed, 'vocabulary') : [],
      sources: Array.isArray(findField(parsed, 'sources')) ? findField(parsed, 'sources') : [],
    };
  };

  const extracted = tryExtractLesson(rawText);
  if (extracted) {
    console.log("buildFallbackLesson: Successfully extracted", extracted.sections.length, "sections from raw text.");
    return extracted;
  }

  // Could not parse JSON — use raw text as lesson content (strip any leading JSON artifacts)
  let content = rawText.trim();
  // Try to repair truncated JSON by closing unclosed brackets/braces
  const contentMatches = content.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
  if (contentMatches && contentMatches.length > 0) {
    // Extract title-content pairs to create multiple sections
    const titleRegex = /"title"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    const titleMatches = [...content.matchAll(titleRegex)].map(m => m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
    
    const extractedSections = contentMatches.map((m, i) => {
      const match = m.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const sectionContent = match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : '';
      const sectionTitle = titleMatches[i] || `Section ${i + 1}`;
      return { title: sectionTitle, content: sectionContent, type: 'concept' as const };
    }).filter(s => s.content.trim().length > 20);

    if (extractedSections.length > 0) {
      console.log("buildFallbackLesson: Extracted", extractedSections.length, "sections via regex.");
      return {
        topic, level, goal,
        sections: extractedSections,
        vocabulary: [], sources: [],
      };
    }
  }

  return {
    topic, level, goal,
    sections: [{ title: topic, content, type: 'concept' as const }],
    vocabulary: [], sources: [],
  };
};

export const GeminiService = {
  hasApiKey: () => Boolean(getApiKey()),
  tokenListener: null as ((metrics: { total: number, input: number, output: number, model: string, label?: string }) => void) | null,
  setTokenListener: (listener: (metrics: { total: number, input: number, output: number, model: string, label?: string }) => void) => {
    GeminiService.tokenListener = listener;
  },
  async synthesizeSpeech(
    text: string,
    options?: { voiceName?: string; prompt?: string; model?: string }
  ): Promise<{ audioData: string; mimeType: string; sampleRate: number } | { error: string }> {
    if (!getApiKey()) return { error: t('api_key_missing') };
    const lang = getLanguage();
    const voiceName = options?.voiceName || 'Aoede';
    const defaultPrompt = lang === 'en'
      ? "Read the following text clearly and fluently in English."
      : (lang === 'ru' ? "Прочитайте следующий текст четко и бегло на русском языке." : "Quyidagi matnni o'zbek tilida ravon va aniq o'qib ber.");

    const prompt = options?.prompt?.trim() || defaultPrompt;
    const preferred = options?.model ? [options.model] : [];
    const fallbackModels = [
      'gemini-3.1-flash-preview-tts',
      'gemini-3.1-flash-tts',
      'gemini-3.1-pro-preview-tts',
      'gemini-1.5-flash-native-audio-preview'
    ];
    const models = [...new Set([...preferred, ...fallbackModels])];
    let lastError = t('voice_error');

    try {
      const response = await fetch('/api/ai/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, text, voiceName, model: models[0] })
      });
      
      const responseText = await response.text();
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        if (!response.ok) throw new Error(`Server error ${response.status}`);
        throw new Error("Invalid response format");
      }

      if (!response.ok || !data) throw new Error(data?.detail || data?.error || `Request failed (${response.status})`);
      if (data.error) throw new Error(data.error);
      
      if (data.audioData) {
        reportUsage(data, models[0] || 'gemini-2.5-flash-tts', 'Speech Synthesis');
      }
      
      return { audioData: data.audioData, mimeType: data.mimeType, sampleRate: 24000 };
    } catch (e: any) {
      console.error("TTS Error:", e);
      return { error: e.message || t('voice_error') };
    }
  },

  /**
   * Analyzes a student's explanation of a topic.
   */
  async analyzeExplanation(topic: string, studentText: string): Promise<ExplainBackAnalysis> {
    if (!getApiKey()) {
      console.warn("No API Key provided. Returning mock data.");
      return getMockAnalysis();
    }

    try {
      const modelName = 'gemini-3.1-flash';
      const lang = getLanguage();
      const langName = lang === 'en' ? 'English' : (lang === 'ru' ? 'Russian' : 'Uzbek');

      const prompt = `
        You are an expert tutor. A student has explained the concept of "${topic}" in ${langName}.
        Analyze their explanation for clarity, accuracy, completeness, and structure.
        Provide a score from 0-100 for each.
        Identify a specific sentence that has an error or could be improved, and provide a corrected version.
        Provide 3 short, bulleted recommendations for improvement in ${langName}.
        IMPORTANT: The transcript may contain STT errors (misheard words, truncated phrases, or unexpected language switches, including Arabic, Chinese, or Indian languages). Do not penalize the student for these transcription artifacts; focus on the intended meaning when possible and be tolerant of noise.
        
        Student Text: "${studentText}"
      `;

      const response = await fetch('/api/ai/analyze-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic, prompt, model: modelName })
      });
      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        throw new Error("Invalid response format");
      }
      if (data?.error) throw new Error(data.error);
      reportUsage(data, modelName, "Explanation Analysis");
      return data as ExplainBackAnalysis;

    } catch (error) {
      console.error("Gemini API Error:", error);
      return getMockAnalysis();
    }
  },

  /**
   * Generates a structured Lesson based on a topic, level, and goal.
   * NOTE: Simulation logic has been moved to a separate request.
   */
  async generateLesson(
    topic: string,
    level: KnowledgeLevel,
    goal: LearningGoal,
    additionalContext?: string,
    images?: Array<{ data: string, mimeType: string }>,
    enableVisuals: boolean = true,
    lessonVolume: 'brief' | 'standard' | 'deep' = 'standard'
  ): Promise<{ lesson: GeneratedLesson | null, error?: string }> {
    if (!getApiKey()) return { lesson: null, error: "No API Key" };

    let levelInstruction = "";
    switch (level) {
      case 'novice':
        levelInstruction = `DIFFICULTY: BEGINNER (Boshlang'ich)
- Start from very far away: explain the *big picture* and motivation first.
- Assume the learner is new to the topic.
- Use simple language, analogies, and everyday examples.
- Avoid formulas, formal definitions, and technical terms unless absolutely necessary.
- If technical terms appear, explain them immediately in plain language.
- Focus on intuition, “why this exists,” and “how to think about it.”
- Keep cognitive load low: one idea at a time.`;
        break;
      case 'intermediate':
        levelInstruction = `DIFFICULTY: INTERMEDIATE (O'rta)
- Assume basic familiarity with the topic.
- Reduce analogies; increase conceptual precision.
- Introduce key terminology and definitions, but explain them clearly.
- Balance intuition with technical understanding.
- Focus on common difficulties, misconceptions, and how ideas connect.
- Include light formalism or equations when helpful, but explain their meaning.`;
        break;
      case 'expert':
        levelInstruction = `DIFFICULTY: ADVANCED (Ekspert)
- Assume strong background knowledge.
- Be concise, precise, and technical.
- Focus on core mechanisms, formal definitions, and important results.
- Minimize pedagogical hand-holding.
- Prioritize correctness, depth, and relevance over ease of learning.
- Use formal notation`;
        break;
    }

    let goalInstruction = "";
    switch (goal) {
      case 'theoretical':
        goalInstruction = `
MODE: THEORETICAL
GOAL: Build deep conceptual understanding of the topic from first principles. Do not teach surface knowledge.

STRUCTURE INSTRUCTIONS:
1. Start with the fundamental question:
   - Why does this concept exist?
   - What problem was it trying to solve?
   - What is the core idea behind it?

2. Explain the concept step-by-step from foundational principles:
   - Define all key terms clearly.
   - Avoid skipping logical steps.
   - Build reasoning progressively.

3. Include:
   - Historical or conceptual origin (if relevant).
   - Underlying mechanisms (HOW it works).
   - Common misconceptions.
   - Intuitive explanation (analogy if helpful).
   - Formal explanation (if mathematical or technical).

TONE: Clear, rigorous, intellectually serious. Encourage thinking, not memorization.
Do NOT focus on exam tricks or job applications.
Do NOT oversimplify unless explicitly requested.
`;
        break;
      case 'technical':
        goalInstruction = `
MODE: TECHNICAL
GOAL: Teach the user how to APPLY this topic in real-world situations or professional contexts.

STRUCTURE INSTRUCTIONS:
1. Brief Concept Overview (max 20% of lesson):
   - Only essential theory needed for application.

2. Real-World Use Cases:
   - Where is this used in industry?
   - Which professions rely on it?
   - Why is it valuable?

3. Step-by-Step Practical Application:
   - Show how to use it.
   - Include procedures, workflows, or frameworks.
   - If relevant, include tools, software, or real scenarios.

4. Practical Example:
   - Walk through a realistic example from start to finish.

5. Mini Practice Task:
   - Give the learner a small applied challenge.
   - Encourage hands-on thinking.

6. Optional: Professional Tips (Common beginner mistakes, Efficiency advice, Best practices).

TONE: Clear, practical, mentor-like. Focus on "doing", not abstract thinking.
Avoid long philosophical explanations or pure theory without use.
`;
        break;
      case 'exam_preparation':
        goalInstruction = `
MODE: EXAM PREPARATION
GOAL: Maximize the learner’s ability to correctly solve exam-style questions on this topic.

STRUCTURE INSTRUCTIONS:
1. Core Exam-Relevant Concepts:
   - Summarize only what is necessary for solving problems.
   - Highlight formulas, patterns, or key definitions.

2. Problem-Solving Strategy:
   - Explain typical question types.
   - Show how to approach them step-by-step.
   - Mention common traps and trick patterns.

3. Worked Examples:
   - Provide at least 3 progressively harder examples.
   - Solve them step-by-step.
   - Clearly explain reasoning at each stage.

4. Timed Practice Section:
   - Provide 3–5 practice questions.
   - Encourage solving before looking at answers.

5. Mistake Analysis:
   - Explain typical student errors.
   - Show how to avoid them.

TONE: Focused, strategic, performance-oriented. Goal: Accuracy and speed.
Avoid long historical context or deep philosophical exploration.
`;
        break;
    }

    const prompt = `
    Task: You are an AI tutor creating structured lessons for learners. Adapt the *teaching strategy*, not just the amount of detail.
    Topic: "${topic}"
    
    ${additionalContext ? `Additional Context/File Content:\n${additionalContext}\n` : ''}

    GENERAL RULES (apply to all levels): 
    - Teach progressively: concepts → intuition → examples → formalization (if appropriate). 
    - Do not assume prior knowledge unless explicitly stated. 
    - Use clear structure with headings. 
    - Avoid unnecessary jargon unless the difficulty requires it. 
    - Prefer understanding over memorization. 

    DIFFICULTY-SPECIFIC INSTRUCTIONS: 
    ${levelInstruction}
    
    ${goalInstruction}

    SAFETY CHECK FIRST: 
    If the topic "${topic}" is inappropriate, hate speech, explicit violence, illegal, or nonsense, you MUST set 'isValid' to false and provide a detailed, polite explanation in 'invalidReason' (${getLanguage() === 'en' ? 'English' : (getLanguage() === 'ru' ? 'Russian' : 'Uzbek')}).
    
    If 'isValid' is true, generate the content ${getLangInstruction()}.
    
    CRITICAL CONTENT RULES:
    1. **NO GREETINGS**: Start DIRECTLY with the content of Section 1.
    2. **VISUALS**: Use **Bold** for key terms. Use '> Blockquotes' for insights.
    3. **STRUCTURE**: Divide into logical sections needed to FULLY cover the topic. ${lessonVolume === 'brief' ? 'Use 3-5 sections. Keep it concise.' : lessonVolume === 'deep' ? 'Use 8-14 sections. Go into maximum depth with rich examples and edge cases.' : 'Use 5-8 sections. Balanced depth and breadth.'}
    4. **SOURCES**: Provide a list of 3-5 real or credible sources/references (books, articles, official docs) used or relevant to this topic in the 'sources' field.
    5. **NO FORCED CODE**: Only include 'code' sections if the topic is programming.
    6. **VOCABULARY**: Extract 5-10 key terms and their definitions used in the text into the 'vocabulary' field (Definitions must be in ${getLanguage() === 'en' ? 'English' : (getLanguage() === 'ru' ? 'Russian' : 'Uzbek')}).
    7. **PARAGRAPHS**: Separate paragraphs with double newlines (\\n\\n).
    8. **LANGUAGE**: All content (titles, text, options, feedback) MUST be in ${getLanguage() === 'en' ? 'English' : (getLanguage() === 'ru' ? 'Russian' : 'Uzbek')}.
    9. **COURSE ALIGNMENT**: If context includes Course/Module/Item details, the content MUST stay inside that domain and subject. For programming, use ONLY the language specified by the course (e.g., C++, Java). Never switch to another language.
    10. **ITEM TYPE ADAPTATION**:
        - If context says Item Type: project, produce a project-focused lesson with sections for brief, requirements, step-by-step plan, deliverables, evaluation criteria, and extensions. Include at least one interaction of type 'challenge'.
        - If context says Item Type: quiz, produce a quiz-focused lesson: 4-7 sections, each with interaction type 'quiz', 4 options, correctIndex, and a short explanation. Minimize theory.
    11. **INTERACTIONS LIMIT**: Use at most ONE interaction per section. Do NOT return an 'interactions' array.
    
    IMPORTANT JSON FORMATTING RULE FOR MATH/LATEX:
    If the content includes mathematical formulas, you MUST use LaTeX format enclosed in single dollar signs (e.g. $E=mc^2$).
    EVEN IF IT IS A STANDALONE FORMULA, WRAP IT IN DOLLARS: "$a^2 + b^2 = c^2$".
    Double-escape backslashes: "\\\\frac{a}{b}"

    ${enableVisuals ? `
    VISUALIZATIONS:
    If a concept is best explained visually (e.g., a graph, chart, timeline, process flow), create a section(s) with type 'visual'.
    For 'visual' sections, you MUST provide a 'visualConfig' object with ONLY the 'type' and 'title' properties. 
    STRICT RULE: DO NOT generate ANY 'data', 'model', or 'config' properties inside visualConfig. These will be generated separately.
    
    Supported visual types:
     1. 'coordinate': Math functions/plots. 
     2. 'network': Relationships/graphs.
     3. 'flow': Processes/flowcharts.
     4. 'timeline': History/sequences.
     5. 'layered': Stacks/architectures.
     6. 'parametric': Interactive models.
     7. 'chemistry': 3D molecular structures (e.g. "Methane Structure").
     8. 'geography': Maps.
     9. 'computer-science': Data structures.
     10. 'mindmap': Hierarchical concept maps/trees.
     11. 'image': Rich AI generated illustrations/photos.

    Example Visual Section: { "type": "visual", "visualConfig": { "type": "chemistry", "title": "Methane Structure" } }
    ` : ''}
    
    Return JSON format.
    Section Types: 'concept' (code samples if programming), 'case_study' (example), 'key_takeaway' (summary), 'visual'.
    `;

    const buildContents = (text: string) => {
      const base: any[] = [{ role: 'user', parts: [{ text }] }];
      if (images && images.length > 0) {
        images.forEach(img => {
          base[0].parts.push({
            inlineData: {
              data: img.data.includes('base64,') ? img.data.split('base64,')[1] : img.data,
              mimeType: img.mimeType
            }
          });
        });
      }
      return base;
    };

    try {
      // Allow Vercel rewrites to proxy to our Python backend without full URL
      const response = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic, prompt, images, model: "gemini-2.5-flash" })
      });

      if (response.status === 401) {
        return { lesson: null, error: "Iltimos, tizimga kiring (login) va qayta urinib ko'ring." };
      }
      if (response.status === 402) {
        return { lesson: null, error: "Limit tugadi. Obuna (subscription) kerak yoki keyinroq urinib ko'ring." };
      }
      if (!response.ok) {
        const msg = await response.text();
        console.warn("Lesson API returned non-OK, building fallback lesson. Status:", response.status);
        return { lesson: buildFallbackLesson(topic, level, goal, msg) };
      }

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      let usageData = null;
      let lessonText = fullText;

      if (fullText.includes('\n--USAGE--\n')) {
        const parts = fullText.split('\n--USAGE--\n');
        lessonText = parts[0];
        try {
          usageData = JSON.parse(parts[1]);
        } catch (e) {
          console.error("Failed to parse streaming usage:", e);
        }
      }

      const rawData = lessonText ? parseJsonLoose(lessonText) : null;
      reportUsage(usageData || rawData, "gemini-2.5-flash", "Lesson Generation", fullText);

      if (!rawData) {
        console.warn("parseJsonLoose returned null, building fallback lesson from raw text.");
        return { lesson: buildFallbackLesson(topic, level, goal, lessonText) };
      }

      if (rawData.isValid === false) {
        return { lesson: null, error: rawData.invalidReason || "Ushbu mavzu bizning xavfsizlik qoidalarimizga to'g'ri kelmaydi." };
      }

      // Handle AI wrapping response in a nested object like { lesson: { sections: [...] } }
      let resolvedSource = rawData;
      if (!Array.isArray(resolvedSource.sections) && resolvedSource.lesson && typeof resolvedSource.lesson === 'object') {
        resolvedSource = resolvedSource.lesson;
      }
      if (!Array.isArray(resolvedSource.sections) && resolvedSource.content && typeof resolvedSource.content === 'object' && Array.isArray(resolvedSource.content.sections)) {
        resolvedSource = resolvedSource.content;
      }
      if (!Array.isArray(resolvedSource.sections) && resolvedSource.data && typeof resolvedSource.data === 'object' && Array.isArray(resolvedSource.data.sections)) {
        resolvedSource = resolvedSource.data;
      }

      const normalizedSections = (() => {
        const input = resolvedSource.sections;
        if (Array.isArray(input)) {
          return input.map((section: any, index: number) => {
            const content = typeof section?.content === 'string'
              ? section.content
              : typeof section?.text === 'string'
                ? section.text
                : typeof section?.body === 'string'
                  ? section.body
                  : typeof section?.description === 'string'
                    ? section.description
                    : '';
            const title = typeof section?.title === 'string' ? section.title : `Section ${index + 1}`;
            const type = typeof section?.type === 'string' ? section.type : 'concept';
            return { ...section, title, content, type };
          }).filter((section: any) => typeof section.content === 'string');
        }
        if (typeof input === 'string') {
          return [{ title: resolvedSource.topic || rawData.topic || topic, content: input, type: 'concept' }];
        }
        if (input && typeof input === 'object' && typeof input.content === 'string') {
          return [{ title: input.title || resolvedSource.topic || rawData.topic || topic, content: input.content, type: input.type || 'concept' }];
        }
        return [];
      })();

      // If normalization produced no sections but we have raw text, build a fallback
      if (normalizedSections.length === 0) {
        console.warn("Section normalization produced 0 sections, building fallback from raw text.");
        return { lesson: buildFallbackLesson(topic, level, goal, lessonText) };
      }

      const lessonData: GeneratedLesson = {
        topic: resolvedSource.topic || rawData.topic || topic,
        level: level,
        goal: goal,
        sections: normalizedSections,
        vocabulary: Array.isArray(resolvedSource.vocabulary || rawData.vocabulary) ? (resolvedSource.vocabulary || rawData.vocabulary) : [],
        sources: Array.isArray(resolvedSource.sources || rawData.sources) ? (resolvedSource.sources || rawData.sources) : [],
        recommendedLabTool: undefined // Will be filled separately
      };

      // Post-processing to ensure visualConfig.type is valid
      lessonData.sections = lessonData.sections.map(section => {
        if (section.visualConfig) {
          const validVisualTypes = ['coordinate', 'network', 'flow', 'timeline', 'layered', 'parametric', 'physics', 'chemistry', 'biology', 'geography', 'computer-science'];
          if (!section.visualConfig.type || !validVisualTypes.includes(section.visualConfig.type)) {
            console.warn(`Invalid or missing visualConfig.type for section: ${section.title}. Removing visualConfig.`);
            return { ...section, visualConfig: undefined };
          }
        }
        return section;
      });

      return { lesson: lessonData };

    } catch (e) {
      console.error("Lesson Generation Error:", e);
      if (isInvalidApiKey(e)) {
        return { lesson: null, error: t('gemini_key_invalid') };
      }
      console.warn("Lesson generation threw, building fallback lesson.");
      return { lesson: buildFallbackLesson(topic, level, goal) };
    }
  },

  async generateVisualConfig(
    visualType: string,
    topic: string,
    sectionContent: string,
    language: string = 'uz'
  ): Promise<{ config: any | null, error?: string }> {
    if (!getApiKey()) return { config: null, error: "No API Key" };

    const langInstruction = language === 'en' ? 'ENGLISH' : language === 'ru' ? 'RUSSIAN' : 'UZBEK (Latin script)';

    let typeRules = "";
    switch (visualType) {
      case 'coordinate':
        typeRules = `
        - MUST include 'data.axes': { "x": "Label X", "y": "Label Y" }.
        - MUST include 'data.series': Array of { "id", "label", "type": "function"|"scatter", "function": "x**2" (JS SYNTAX ONLY, NO LATEX), or "points": [[x,y]] }.
        - IMPORTANT: For 'function', use JavaScript syntax (e.g. Math.sin(x), x**2). DO NOT use LaTeX (e.g. $x^2$, \\sin(x)).
        - OPTIONAL: 'data.parameters': Array of { "id", "label", "min", "max", "defaultValue" } for interactive sliders (e.g. y = a*x + b).
        - OPTIONAL: 'data.domain': [xMin, xMax], 'data.range': [yMin, yMax].
        - MUST include 'data.labels': Localized UI strings (parameters, reset, zoomIn, zoomOut, resetView, initializing, error, retry) in ${langInstruction}.
        `;
        break;
      case 'network':
        typeRules = `
        - MUST include 'data.nodes': Array of { "id", "label", "icon" (Material Symbol name), "group" (source/target/hidden) }.
        - MUST include 'data.links': Array of { "source", "target" }.
        `;
        break;
      case 'flow':
        typeRules = `
        - MUST include 'data.nodes': Array of { "id", "type": "start"|"process"|"decision"|"end", "label" }.
        - MUST include 'data.edges': Array of { "source", "target", "label" (optional) }.
        `;
        break;
      case 'timeline':
        typeRules = `
        - MUST include 'data.events': Array of { "id", "date" (ISO), "title", "description" }.
        `;
        break;
      case 'layered':
        typeRules = `
        - MUST include 'data.layers': Array of { "id", "label", "items": ["Item 1"] }.
        `;
        break;
      case 'parametric':
        typeRules = `
        - MUST include 'data.parameters': Array of { "id", "label", "type": "slider", "min", "max", "defaultValue" }.
        - MUST include 'data.outputs': Array of { "id", "label", "formula" (JS math, e.g. "param1 * 2") }.
        `;
        break;
      case 'chemistry':
        typeRules = `
        - MUST include 'data.molecules': Array of { "id", "name", "atoms": [{"id", "element"}], "bonds": [{"source", "target", "type": "single"|"double"|"triple"}] }.
        - EXAMPLE: "data": { "molecules": [ { "id": "m1", "name": "Methane", "atoms": [ {"id":"a1","element":"C"}, {"id":"a2","element":"H"} ], "bonds": [ {"source":"a1","target":"a2","type":"single"} ] } ] }
        - DO NOT use "model" or "smiles" format.
        - DO NOT provide x, y, z coordinates. The physics engine will handle it.
        - OPTIONAL 'data.view': { "distance", "phi", "theta" }.
        `;
        break;
      case 'geography':
        typeRules = `
        - MUST include 'data.mode': "interactive" | "satellite" | "atlas" | "topographic".
        - MUST include 'data.markers': Array of { "id", "lat", "lng", "label", "description", "icon", "color" }.
        - OPTIONAL 'data.atlasData': Array of { "id", "name", "color", "points": [[lat, lng], ...] } for territories/history.
        - OPTIONAL 'data.center': { "lat", "lng" }, 'data.zoom': number.
        `;
        break;
      case 'computer-science':
        typeRules = `
        - MUST include 'data.diagramType': "array"|"tree"|"memory".
        - MUST include 'data.nodes': Array of {"id", "label", "subtitle", "x" (0-100), "y" (0-100), "color", "isHighlighted"}.
        - OPTIONAL 'data.edges': Array of {"source", "target", "label", "directed"}.
        - OPTIONAL 'data.pointers': Array of {"targetId", "label", "color", "direction": "top"|"bottom"|"left"|"right"}.
        `;
        break;
      case 'mindmap':
        typeRules = `
        - MUST include a root 'data' object (MindNode) with: 'id', 'title', 'description', 'icon' (Material Symbol), and 'children' (Array of MindNodes).
        - Create a deep, hierarchical tree structure (3-4 levels deep).
        `;
        break;
      case 'image':
        typeRules = `
        - MUST include 'data.prompt': A highly detailed, artistic, and descriptive prompt for an AI image generator (Stable Diffusion style).
        - Include style keywords like 'cinematic', 'high resolution', 'educational illustration', '3d render', or 'professional photography'.
        - OPTIONAL 'data.aspectRatio': '1:1', '4:3', '16:9' (default 16:9).
        `;
        break;
      default:
        return { config: null, error: "Unsupported visual type" };
    }

    const prompt = `
    Task: Generate a rich structured JSON data configuration for a '${visualType}' visualization.
    Topic: "${topic}"
    Section Context: "${sectionContent.substring(0, 2000)}"
    Output Language: ${langInstruction}

    Rules for '${visualType}':
    ${typeRules}

    STRICT CONSTRAINTS:
    - 'description' MUST be very concise (MAX 2 sentences).
    - 'data' MUST be fully populated according to the type rules.
    - Respond ONLY with the JSON object.
    `;



    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          prompt,
          config: { maxOutputTokens: 8192, responseMimeType: "application/json" }
        })
      });

      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        if (!response.ok) throw new Error(`Server error ${response.status}`);
        throw new Error("Invalid response format");
      }

      if (!response.ok || !data) throw new Error(data?.detail || data?.error || `Request failed (${response.status})`);

      const parsedConfig = parseJsonLoose(data.text || '');
      reportUsage(data, 'gemini-2.5-flash', 'Visual System Config');
      if (!parsedConfig) return { config: null, error: "Bo'sh javob" };
      parsedConfig.type = visualType; // Force enforce the type requested
      return { config: parsedConfig };

    } catch (e) {
      console.error("Visual Config Gen Error:", e);
      if (isInvalidApiKey(e)) return { config: null, error: t('gemini_key_invalid') };
      return { config: null, error: t('connection_error') };
    }
  },

  async generateRoadmap(
    topic: string,
    level: KnowledgeLevel,
    additionalPrompt?: string,
    fileContent?: string,
    images?: Array<{ data: string, mimeType: string }>,
    enableVisuals: boolean = true
  ): Promise<{ roadmap: GeneratedRoadmap | null, error?: string }> {
    if (!getApiKey()) return { roadmap: null, error: "No API Key" };

    const prompt = `
    Task: Create a comprehensive learning roadmap(curriculum) for "${topic}".
      Target Level: ${level}
      
      ${additionalPrompt ? `Additional User Instructions: "${additionalPrompt}"` : ''}
      ${fileContent ? `Context from uploaded file: \n${fileContent.slice(0, 3000)}...` : ''}

      Output Language: ${getLangInstruction()}.
      
      Structure Requirement:
    - Break down the roadmap into logical "Modules" that comprehensively cover the curriculum.Do NOT arbitrarily limit the number of modules.
      - Each Module must have specific "Items"(Lessons/ Projects / Quizzes) covering all necessary sub-topics.
      - Each Item needs:
- title(short, clear)
  - description(what will be learned / done)
  - type(lesson | project | quiz)
  - estimatedDuration(e.g., "15 min", "2 hours")

      Return JSON format matching this structure:
      {
        "title": "Course Title",
        "description": "Course Description",
        "level": "${level}",
        "totalDuration": "e.g., 10 hours",
        "modules": [
          {
            "id": "m1",
            "title": "Module Name",
            "description": "Module Description",
            "items": [
              {
                "id": "i1",
                "title": "Lesson Title",
                "description": "What to learn",
                "type": "lesson",
                "estimatedDuration": "20 min"
              }
            ]
          }
        ]
      }
    `;

    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
    if (images && images.length > 0) {
      images.forEach(img => {
        contents[0].parts.push({
          inlineData: {
            data: img.data.includes('base64,') ? img.data.split('base64,')[1] : img.data,
            mimeType: img.mimeType
          }
        });
      });
    }

    try {
      const response = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic, level, additionalPrompt, fileContent, images, prompt })
      });
      
      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(`Server error (${response.status}): ${text || response.statusText}`);
        }
        throw new Error("Invalid server response format");
      }
      
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const parsed = data;
      reportUsage(parsed, 'gemini-2.5-flash', "Roadmap Generation");
      if (!parsed || !parsed.modules || !Array.isArray(parsed.modules)) {
        if (parsed && !parsed.modules) {
             // Maybe it's a direct array or different shape?
             // But the prompt asks for modules.
        }
        parsed.modules = parsed.modules || [];
      }
      return { roadmap: parsed as GeneratedRoadmap };

    } catch (e: any) {
      console.error("Roadmap Gen Error:", e);
      return { roadmap: null, error: e.message || t('generic_error') };
    }
  },

  async verifyFullLesson(lesson: any) {
    try {
      const resp = await fetch('/api/ai/verify-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lesson })
      });
      const data = await resp.json();
      reportUsage(data, 'gemini-2.5-flash', "Lesson Verification");
      if (!resp.ok) throw new Error(data.detail || data.error || 'Verification failed');
      return data;
    } catch (e: any) {
      console.error("Verification Error:", e);
      return { isValid: false, issues: [], overallFeedback: "Error: " + (e as any).message };
    }
  },

  async refineSection(topic: string, lesson: any, sectionIndex: number, feedback?: string) {
    try {
      const resp = await fetch('/api/ai/refine-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic, lesson, sectionIndex, feedback })
      });
      const data = await resp.json();
      reportUsage(data, 'gemini-2.5-flash', "Section Refinement");
      if (!resp.ok) throw new Error(data.detail || data.error || 'Refinement failed');
      return { section: data };
    } catch (e: any) {
      console.error("Refinement Error:", e);
      return { error: (e as any).message };
    }
  },

  async findBestLabTool(topic: string): Promise<ExternalLabTool | undefined> {
    if (!getApiKey()) return getFallbackTool(topic);

    // Create a simplified list of tools to save context window
    const catalogSummary = LAB_TOOLS.map(t => ({ id: t.id, title: t.title, desc: t.description, tags: t.tags }));

    const prompt = `
    Topic: "${topic}"

    Task: Find the best interactive simulation tool for this topic from the 'Catalog' below.
    If a tool matches well, return its ID. If no tool matches well, return "none".
    Do not invent or suggest tools outside this catalog.

      Catalog:
    ${JSON.stringify(catalogSummary)}
    
    Output JSON format:
    {
      "matchType": "catalog" | "none",
        "toolId": "string (only if matchType is catalog)"
    }
    `;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, model: 'gemini-2.5-flash', config: { responseMimeType: "application/json" } })
      });
      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        return getFallbackTool(topic);
      }
      if (data?.error) return getFallbackTool(topic);
      reportUsage(data, 'gemini-2.5-flash', "Lab Tool Search");

      let result;
      try {
        result = data.text ? parseJsonLoose(data.text) : null;
      } catch (e) {
        console.error("JSON Parse Error (Lab Tool):", e);
        return getFallbackTool(topic);
      }

      if (!result || result.matchType === 'none') return getFallbackTool(topic);
      if (result.matchType === 'catalog' && result.toolId) {
        const match = LAB_TOOLS.find(t => t.id === result.toolId);
        return match || getFallbackTool(topic);
      }
      return getFallbackTool(topic);

    } catch (e) {
      console.error("Tool search error, using fallback:", e);
      return getFallbackTool(topic);
    }
  },

  /**
   * Generates adaptive practice questions based on user performance history.
   */
  async generateAdaptivePracticeQuestions(
    topic: string,
    currentDifficulty: number,
    count: number = 2,
    history?: { question: string; isCorrect: boolean }[],
    mode?: 'quiz' | 'practice'
  ): Promise<PracticeQuestion[]> {
    if (!getApiKey()) return [];

    const historyPrompt = history && history.length > 0
      ? `\nUser History on this topic: \n${history.map(h => `- Q: ${h.question} -> ${h.isCorrect ? 'Correct' : 'Incorrect'}`).join('\n')} \nFocus on strengthening areas they got incorrect, while maintaining areas they got correct.`
      : '';

    const prompt = `
    Task: Generate ${count} adaptive practice questions about "${topic}".
      Target Difficulty: ${currentDifficulty} out of 10 (1 = Beginner, 10 = Expert).
      STRICT REQUIREMENT: Questions MUST be extremely challenging, testing deep comprehension, subtle technical details, and edge cases. Avoid trivial or simple recall questions. Options should have highly nuanced differences.
      Language: ${getLangInstruction()}.
        ${historyPrompt}

      Format Requirements:
      Return a JSON array of objects, where each object matches this interface:
{
  "id": "unique-uuid-or-short-id",
    "type": "multiple_choice" | "explain_back" | "match_sorting",
      "difficulty": ${currentDifficulty},
  "questionText": "The question here",

    // IF type === "multiple_choice" (MUST provide 4 options):
    "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact string of the correct option",

        // IF type === "match_sorting" (Provide 3 to 4 pairs):
        "pairs": [
          { "term": "Term 1", "definition": "Definition 1" },
          { "term": "Term 2", "definition": "Definition 2" }
        ],

          // FOR ALL TYPES:
          "explanation": "Why this is correct, or what a good explain_back answer would look like."
}

      Important rules:
      - ${mode === 'quiz' ? 'STRICTLY MULTIPLE CHOICE questions.' : 'Mix ALL question types to keep it engaging.'}
      - Use "explain_back" for conceptual synthesis.
      - Use "match_sorting" to associate terms with definitions or concepts with examples.
      - Use "multiple_choice" for factual recall or specific applications.
      - If "gap_filling", the blanks MUST target critical conceptual keywords only. **DO NOT include formulas, equations, or mathematical notation in gap-filling questions.**
      - If "multiple_choice", the options array MUST contain the correctAnswer.
    `;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt, config: { responseMimeType: "application/json" } })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Practice Question Generation");
      if (!response.ok) {
        const errorMsg = typeof data.detail === 'object' && data.detail !== null
          ? JSON.stringify(data.detail)
          : (data.detail || data.error || `Server Error ${response.status}`);
        throw new Error(String(errorMsg));
      }
      if (data.error) throw new Error(data.error);
      const array = parseJsonLoose(data.text || '[]');
      const finalArray = Array.isArray(array) ? array : (array?.questions || array?.data || []);
      return finalArray.map((q: any, i: number) => {
        let options = q.options;
        if (Array.isArray(options)) {
           options = options.map((opt: any) => typeof opt === 'string' ? opt : (opt.text || JSON.stringify(opt)));
        }
        let pairs = q.pairs;
        if (Array.isArray(pairs)) {
           pairs = pairs.map((p: any) => ({
              term: typeof p.term === 'string' ? p.term : (p.term?.text || String(p.term || "")),
              definition: typeof p.definition === 'string' ? p.definition : (p.definition?.text || String(p.definition || ""))
           }));
        }
        return {
          ...q,
          questionText: typeof q.questionText === 'string' ? q.questionText : (q.questionText?.text || q.question || q.question?.text || ""),
          options: options,
          correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : (q.correctAnswer?.text || String(q.correctAnswer || "")),
          explanation: typeof q.explanation === 'string' ? q.explanation : (q.explanation?.text || String(q.explanation || "")),
          pairs: pairs,
          id: q.id || `q-${currentDifficulty}-${Date.now()}-${i}`
        };
      }) as PracticeQuestion[];
    } catch (e) {
      console.error("Adaptive Question Error:", e);
      return [];
    }
  },

  /**
   * Expands a specific section with more detail.
   */
  async expandSection(topic: string, sectionTitle: string, currentContent: string): Promise<string | null> {
    if (!getApiKey()) return null;

    const prompt = `
    The user wants a "Deep Dive" into a specific section of a lesson about "${topic}".
    Section Title: "${sectionTitle}"
    Current Content: "${currentContent}"
Task: Write 3 - 4 distinct, detailed paragraphs ${getLangInstruction()}.Bold key terms.Use LaTeX($...$) for math.Return ONLY Markdown.
    `;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Section Expansion");
      if (!response.ok) return null;
      return data.text || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Simplifies a specific section.
   */
  async simplifySection(topic: string, sectionTitle: string, currentContent: string): Promise<string | null> {
    if (!getApiKey()) return null;

    const prompt = `
    The user wants a "Simpler Explanation"(ELI5) of a section about "${topic}".
    Section Title: "${sectionTitle}"
    Current Content: "${currentContent}"
Task: Rewrite the content ${getLangInstruction()}.
- Use simple analogies and metaphors.
    - Avoid complex jargon.
    - Keep it concise but clear.
    - Write as if explaining to a 12 - year old.
    - Bold key terms. 
    Return ONLY Markdown.
    `;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Section Simplification");
      if (!response.ok) return null;
      return data.text || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Explains selected text in context
   */
  async explainSelection(topic: string, context: string, selection: string, userQuestion?: string): Promise<string> {
    if (!getApiKey()) return t('api_key_missing');
    const specificTask = userQuestion ? `User Question: "${userQuestion}"` : `Task: Concise explanation of selection.`;
    const prompt = `Topic: ${topic} \nContext: ...${context}...\nSelection: "${selection}"\n${specificTask} \nIMPORTANT: Respond ${getLangInstruction()} using Markdown (bold, list, code if needed).`;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Selection Explanation");
      return data.text || t('explanation_failed');
    } catch (e) {
      return t('ai_connection_error');
    }
  },

  /**
   * Chat with lesson context
   */
  async chatWithLessonContext(
    message: string, 
    context: string, 
    history: {role: 'user'|'assistant', content: string}[]
  ): Promise<string> {
    if (!getApiKey()) return t('api_key_missing');
    
    // Format conversation history for the text prompt
    const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n\n');
    
    const prompt = `You are a helpful and intelligent AI teaching assistant built into the Idrok learning platform. Your goal is to help the user understand the current lesson in deep detail, acting like a friendly tutor.

CURRENT LESSON TITLE & CONTEXT:
${context}

Instructions:
1. Answer the user's questions based primarily on this context if it is relevant.
2. If the user asks something outside the context but educational, you may answer it gently, keeping it related to the subject if possible.
3. If it's completely off-topic (e.g., asking for a recipe in a math lesson), politely guide them back to the learning topic.
4. Respond ${getLangInstruction()} using clean Markdown formatting (bold, lists, code blocks if appropriate).
5. Always be encouraging and clear.

Conversation History:
${historyText ? historyText + '\n\n' : ''}User: ${message}
Assistant:`;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Lesson Assistant Chat");
      return data.text || t('empty_response');
    } catch (e) { 
      return t('connection_error'); 
    }
  },

  async repairVisual(
    currentConfig: any,
    error: string,
    context: string
  ): Promise<any> {
    if (!getApiKey()) throw new Error("No API Key");

    const prompt = `
      You are a Visual DSL Repair Engine.
      The user has a JSON configuration for a visualization that is either invalid or producing an error.
      
      Current Config:
      ${JSON.stringify(currentConfig, null, 2)}
      
      Error Message:
      ${error}

Context / Goal:
      ${context}

Task:
1. Analyze the error and the config.
      2. Fix the JSON to be valid and correct according to the implied schema.
      3. Return ONLY the corrected JSON configuration.
      4. Ensure the 'type' field remains correct.
      5. Do not change the visual type unless absolutely necessary.

  Output: JSON only.
    `;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt, config: { responseMimeType: 'application/json' } })
      });

      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Visual DSL Repair");
      if (!response.ok) throw new Error(data?.detail || data?.error || 'Request failed');

      const parsed = parseJsonLoose(data.text || '');
      if (!parsed) throw new Error("Empty response");
      return parsed;
    } catch (e: any) {
      console.error("Repair Error:", e);
      throw e;
    }
  },

  async findLabTools(query: string): Promise<string[]> {
    if (!getApiKey()) return [];
    const toolList = LAB_TOOLS.map(t => `- ID: ${t.id}, Title: ${t.title}, Desc: ${t.description} `).join('\n');
    const prompt = `Query: "${query}"\nTask: Return top 5 relevant tool IDs from list as JSON array of strings.\nList: \n${toolList} `;
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt, config: { responseMimeType: 'application/json' } })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Lab Tool Search");
      if (!response.ok) return [];
      const ids = data.text ? parseJsonLoose(data.text) : [];
      return Array.isArray(ids) ? ids : [];
    } catch (e) { return []; }
  },

  async solveHomework(
    imageData?: { data: string; mimeType: string },
    textQuery?: string
  ): Promise<{ steps: { title: string; content: string; isAnswer?: boolean }[]; subject: string; error?: string }> {
    try {
      const response = await fetch('/api/ai/solve-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageData, textQuery })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Homework Solver");
      if (data.error) throw new Error(data.error);
      return {
        ...data,
        steps: Array.isArray(data.steps) ? data.steps : [],
        subject: data.subject || '',
      };
    } catch (e: any) {
      console.error('Solver Error:', e);
      return { steps: [], subject: '', error: e.message || t('generic_error') };
    }
  },

  async chatWithTutor(message: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: message + ` (Respond ${getLangInstruction()})` })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-2.5-flash', "Tutor Chat");
      return data.text || t('empty_response');
    } catch (e) { return t('connection_error'); }
  },

  async analyzeSources(sources: StudySource[], onProgress?: (step: string, progress: number) => void): Promise<{ materials: GeneratedStudyMaterials | null, error?: string }> {
    if (!getApiKey()) return { materials: null, error: t('api_key_missing') };
    if (sources.length === 0) return { materials: null, error: "Hech qanday manba ko'rsatilmadi" };

    try {
      const parts: any[] = [];
      for (const s of sources) {
        if (s.content.startsWith('data:')) {
          const [meta, base64Data] = s.content.split(',');
          const mimeType = s.mimeType || meta.match(/:(.*?);/)?.[1] || 'application/octet-stream';
          parts.push({ text: `\n[File Source: ${s.name}]\n` });
          parts.push({ inlineData: { data: base64Data, mimeType } });
        } else if (s.type === 'youtube') {
          parts.push({ text: `\n[YouTube Source: ${s.name}]\nLink: ${s.content}\nNote: Analyze the video content, structure, and key takeaways.\n` });
        } else {
          parts.push({ text: `\n[Source: ${s.name} (${s.type})]\n${s.content}\n` });
        }
      }

      onProgress?.('Malumotlar tahlil qilinmoqda...', 30);
      const prompt = [
        { text: `You are an elite educational content creator. Analyze the following sources to form a comprehensive knowledge base.\nRespond ONLY in ${getLangInstruction()}.\n\nTASK:\n1. Determine a main "topic".\n2. Write a 2-3 paragraph "summary".\n3. Generate "structuredNotes": an array of sections covering key concepts. Each section needs: id, title, content, and type ('note', 'takeaway', 'insight').\n\nReturn JSON: { "topic": "...", "summary": "...", "structuredNotes": [...] }\n\nSOURCES:\n` },
        ...parts
      ];

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.1-pro',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        })
      });

      const resultData = await response.json();
      reportUsage(resultData, 'gemini-3.1-pro', "Source Analysis");
      if (resultData.error) throw new Error(resultData.error);
      const data = parseJsonLoose(resultData.text || '') || {};
      if (!data.summary) throw new Error("Summary generation failed");

      onProgress?.('Tahlil yakunlandi', 100);
      return { 
        materials: { 
          id: `study-${Date.now()}`, 
          topic: data.topic || 'Yangi mavzu', 
          summary: data.summary,
          structuredNotes: (data.structuredNotes || []).map((sn: any, i: number) => ({ ...sn, id: sn.id || `sn-${i}` }))
        } 
      };
    } catch (e) {
      console.error("[GeminiService] Error in analyzeSources:", e);
      return { materials: null, error: t('error_internet') };
    }
  },

  async chatWithSourcesLive(
    message: string,
    materials: GeneratedStudyMaterials,
    history: AssistantMessage[]
  ): Promise<string> {
    if (!getApiKey()) return t('api_key_missing');

    const prompt = `You are "Spark.E", a personalized AI tutor that is an expert on the provided study materials.
    Your goal is to help the student understand the topics in depth based ONLY on the provided context if possible.
    
    STUDY CONTEXT:
    Topic: ${materials.topic}
    Summary: ${materials.summary}
    Notes: ${JSON.stringify(materials.structuredNotes)}
    
    Instructions:
    - Reference specific parts of the notes in your explanations.
    - Be encouraging, concise, and structured.
    - Respond ${getLangInstruction()}.
    
    Conversation History:
    ${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
    USER: ${message}
    SPARK.E:`;

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.1-flash',
          prompt
        })
      });
      const data = await response.json();
      reportUsage(data, 'gemini-3.1-flash', "Source-Aware Chat");
      return data.text || t('empty_response');
    } catch (e) {
      return t('connection_error');
    }
  },

  async generateMindmapFromSummary(summary: string): Promise<{ mindmap: MindNode | null, error?: string }> {
    if (!getApiKey()) return { mindmap: null, error: t('api_key_missing') };
    try {
      const prompt = `Based on this summary:\n${summary}\n\nTASK: Create a highly structured, hierarchical Mindmap JSON.\n- Level 0: root\n- Level 1: 3-5 major modules\n- Level 2: Sub-topics\nEach node must have "id", "title", "description" (brief), "icon" (Material Symbol name), and optional "children" array.\nReturn JSON: { "mindmap": { "id":"root", "title":"...", "icon":"hub", "children": [...] } }\nRespond in ${getLangInstruction()}.`;
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config: { responseMimeType: 'application/json' } })
      });
      const resultData = await response.json();
      reportUsage(resultData, 'gemini-2.5-flash', "Mindmap Generation");
      if (resultData.error) throw new Error(resultData.error);
      const data = parseJsonLoose(resultData.text || '') || {};
      return { mindmap: data.mindmap || null };
    } catch (e) {
      return { mindmap: null, error: t('error_internet') };
    }
  },

  async generateFlashcardsFromSummary(summary: string): Promise<{ flashcards: Flashcard[] | null, error?: string }> {
    if (!getApiKey()) return { flashcards: null, error: t('api_key_missing') };
    try {
      const prompt = `Based on this summary:\n${summary}\n\nTASK: Generate 10-15 deep, conceptual flashcards.\nReturn JSON: { "flashcards": [ {"id":"f1", "question":"...", "answer":"...", "hint":"..."} ] }\nRespond in ${getLangInstruction()}.`;
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config: { responseMimeType: 'application/json' } })
      });
      const resultData = await response.json();
      reportUsage(resultData, 'gemini-2.5-flash', "Flashcards Generation");
      if (resultData.error) throw new Error(resultData.error);
      const data = parseJsonLoose(resultData.text || '') || {};
      return { flashcards: data.flashcards || null };
    } catch (e) {
      return { flashcards: null, error: t('error_internet') };
    }
  },

  async generateFlashcardsForLesson(lesson: GeneratedLesson): Promise<{ flashcards: Flashcard[] | null, error?: string }> {
    if (!getApiKey()) return { flashcards: null, error: t('api_key_missing') };
    try {
      const lessonSummary = lesson.sections.map(s => `Title: ${s.title}\nContent: ${s.content}`).join('\n\n');
      const vocabulary = lesson.vocabulary.map(v => `${v.term}: ${v.definition}`).join('\n');

      const prompt = `
        Task: Create a set of 8-12 high-quality, conceptual flashcards based on the following lesson content and vocabulary.
        
        Lesson Topic: "${lesson.topic}"
        Lesson Content:
        ${lessonSummary}
        
        Vocabulary:
        ${vocabulary}
        
        Requirements:
        1. Focus on the most important concepts, definitions, and applications.
        2. Questions should be clear and concise.
        3. Answers should be thorough but easy to memorize.
        4. Include a short "hint" for each card to help the student if they get stuck.
        5. Return ONLY a JSON object in the following format:
           { "flashcards": [ { "id": "f1", "question": "...", "answer": "...", "hint": "..." } ] }
        
        Respond ONLY in ${getLangInstruction()}.
      `;

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt, config: { responseMimeType: 'application/json' } })
      });
      const resultData = await response.json();
      reportUsage(resultData, 'gemini-2.5-flash', 'Flashcard Generation');
      if (resultData.error) throw new Error(resultData.error);
      const data = parseJsonLoose(resultData.text || '') || {};
      return { flashcards: (data.flashcards || []).map((f: any, i: number) => ({ ...f, id: f.id || `f-${Date.now()}-${i}` })) };
    } catch (e) {
      console.error("Flashcards Gen Error:", e);
      return { flashcards: null, error: t('error_internet') };
    }
  },

  /**
   * Generates a Mastery Path (3 stages) for a topic.
   */
  async generateMasteryPathTasks(topic: string, goal: LearningGoal): Promise<MasteryTask[]> {
    const tasks: MasteryTask[] = [
      {
        id: `task-${Date.now()}-0`,
        title: "quiz",
        definition: "practical",
        type: "knowledge_check",
        status: "available",
        question: "Practical quiz",
        correctAnswer: "Answer"
      },
      {
        id: `task-${Date.now()}-1`,
        title: "quiz",
        definition: "logical",
        type: "knowledge_check",
        status: "locked",
        question: "Logical quiz",
        correctAnswer: "Answer"
      },
      {
        id: `task-${Date.now()}-2`,
        title: "Essay",
        definition: "writing",
        type: "writing_task",
        status: "locked",
        question: "Writing task",
        correctAnswer: "Answer"
      },
      {
        id: `task-${Date.now()}-3`,
        title: "ExplainBack",
        definition: "conversation",
        type: "explain_back",
        status: "locked",
        question: "Explain back",
        correctAnswer: "Answer"
      }
    ];

    return tasks;
  },


  /**
   * Generates a comprehensive 15-question quiz for Mastery Stage 1.
   */
  async generateMasteryStage1Quiz(topic: string, lessonContent: string): Promise<PracticeQuestion[]> {
    if (!getApiKey()) return [];

    const generateQuestions = async (typeTask: string, count: number, instructions: string) => {
        const prompt = `
          Task: Generate exactly ${count} technical questions for a Mastery Stage 1 quiz on "${topic}".
          Source text strictly from:
          ---
          ${lessonContent.substring(0, 4000)}
          ---
          
          REQUIREMENTS:
          1. EXACTLY ${count} questions in total. No more, no less.
          2. ALL questions MUST include an "explanation" field (1-2 sentences).
          3. ${instructions}
          
          Language: ${getLangInstruction()}.
          Return JSON array of EXACTLY ${count} PracticeQuestion objects. FAST RESPONSE.
        `;

        try {
          const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gemini-2.5-flash',
              prompt,
              config: { responseMimeType: "application/json" }
            })
          });

          const data = await response.json();
          reportUsage(data, 'gemini-2.5-flash', `Stage 1 Quiz: ${typeTask}`);
          if (!response.ok) throw new Error(data.detail || data.error);
          
          const array = parseJsonLoose(data.text || '[]');
          return Array.isArray(array) ? array : (array?.questions || array?.data || []);
        } catch (e) {
          console.error(`Stage 1 Quiz Gen Error (${typeTask}):`, e);
          return [];
        }
    };

    try {
      const [mcqData, gapData, matchData] = await Promise.all([
        generateQuestions('Multiple Choice', 5, 'TASK: 5 Multiple Choice Questions. EXACTLY 5 HARD difficulty. Each MUST have 4 "options" and 1 "correctAnswer". type: "multiple_choice"'),
        generateQuestions('Gap Filling', 5, 'TASK: 5 Gap Filling Questions. VERY HARD difficulty. Blanks MUST target essential keywords. NO FORMULAS. MUST fully populate BOTH "blankText" (with "___") AND "blankAnswer". type: "gap_filling"'),
        generateQuestions('Term Matching', 5, 'TASK: 5 Term Matching Questions. Each MUST fully populate the "pairs" array with 5-6 pairs of "term" and "definition". type: "match_sorting"')
      ]);

      const finalArray = [...mcqData, ...gapData, ...matchData];
      
      return finalArray.map((q: any, i: number) => {
        let options = q.options;
        if (Array.isArray(options)) {
           options = options.map((opt: any) => typeof opt === 'string' ? opt : (opt.text || JSON.stringify(opt)));
        }
        let pairs = q.pairs;
        if (Array.isArray(pairs)) {
           pairs = pairs.map((p: any) => ({
              term: typeof p.term === 'string' ? p.term : (p.term?.text || String(p.term || "")),
              definition: typeof p.definition === 'string' ? p.definition : (p.definition?.text || String(p.definition || ""))
           }));
        }
        return {
          ...q,
          questionText: typeof q.questionText === 'string' ? q.questionText : (q.questionText?.text || q.question || q.question?.text || ""),
          options: options,
          correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : (q.correctAnswer?.text || String(q.correctAnswer || "")),
          explanation: typeof q.explanation === 'string' ? q.explanation : (q.explanation?.text || String(q.explanation || "")),
          pairs: pairs,
          id: q.id || `q1-${Date.now()}-${i}`
        };
      }) as PracticeQuestion[];
    } catch (e) {
      console.error("Stage 1 Quiz Gen Error (Aggregation):", e);
      return [];
    }
  },

  /**
   * Analyzes a student's answer for a specific mastery task.
   */
  async analyzeMasteryTask(topic: string, task: MasteryTask, userAnswer: string): Promise<MasteryTask['feedback']> {

    const langName = getLanguage() === 'en' ? 'English' : (getLanguage() === 'ru' ? 'Russian' : 'Uzbek');

    const prompt = `
      Task Type: ${task.type}
      Topic: "${topic}"
      Question: "${task.question}"
      Reference Answer: "${task.correctAnswer}"
      Student's Answer: "${userAnswer}"

      Analyze the student's answer and provide feedback.
      Return JSON:
      {
        "isCorrect": boolean,
        "explanation": "Detailed explanation of misunderstood ideas or concepts",
        "mistakes": ["Clear identification of specific mistake 1", "Specific mistake 2"],
        "correctAnswer": "The ideal explanation or correct answer",
        "suggestions": ["Actionable suggestion for improvement 1", "Suggestion 2"]
      }
      Respond ONLY in ${getLangInstruction()}.
    `;

    try {
      const responseBody = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          config: { responseMimeType: "application/json" }
        })
      });

      const resultData = await responseBody.json();
      reportUsage(resultData, 'gemini-2.5-flash', "Mastery Task Analysis");
      if (resultData.error) throw new Error(resultData.error);
      return parseJsonLoose(resultData.text || '{}');
    } catch (e) {
      console.error("Mastery Analysis Error:", e);
      return undefined;
    }
  },

  async evaluateGapFillingAnswer(
    text: string,
    userAnswer: string,
    correctAnswer: string
  ): Promise<{ isCorrect: boolean; feedback: string }> {

    const prompt = `
      Task: Evaluate a student's answer for a Gap Filling question.
      Sentence with Gap: "${text}"
      Expected Answer: "${correctAnswer}"
      Student's Answer: "${userAnswer}"

      Determine if it is correct or conceptually identical. Provide helpful feedback.
      Return JSON:
      {
        "isCorrect": boolean,
        "feedback": "Why it is correct/incorrect, giving the correct answer if incorrect"
      }
      Respond ONLY in ${getLangInstruction()}.
    `;

    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          config: { responseMimeType: "application/json" }
        })
      });
      const data = await resp.json();
      reportUsage(data, 'gemini-2.5-flash', "Gap Filling Evaluation");
      if (data.error) throw new Error(data.error);
      return parseJsonLoose(data.text || '{}');
    } catch (e) {
      console.error("Evaluate Gap Answer Error:", e);
      return { isCorrect: false, feedback: t('connection_error') };
    }
  },

  async analyzeQuizResults(topic: string, history: { question: string; isCorrect: boolean }[]): Promise<QuizAnalysis | string> {

    const prompt = `
      Task: Analyze a student's quiz results on the topic "${topic}".
      Results:
      ${history.map(h => `- ${h.question} -> ${h.isCorrect ? 'Correct' : 'Incorrect'}`).join('\n')}

      Generate a structured, extremely concise feedback report.
      Return MUST be a valid JSON object matching this structure:
      {
        "summary": "Short 1-2 sentence encouraging summary",
        "strengths": ["Bullet 1 (max 8 words)", "Bullet 2"],
        "improvements": ["Bullet 1 (max 8 words)", "Bullet 2"],
        "recommendation": "Short 1 sentence study tip"
      }
      
      CRITICAL rules:
      - Keep text EXTREMELY SHORT and ACTIONABLE.
      - Avoid conversational filler ("Great job!", "You are doing well").
      - Focus on facts and next steps.
      - Respond ONLY in ${getLangInstruction()}.
    `;

    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          prompt,
          config: { responseMimeType: "application/json" }
        })
      });
      const data = await resp.json();
      reportUsage(data, 'gemini-2.5-flash', "Quiz Results Analysis");
      if (data.error) throw new Error(data.error);
      const parsed = parseJsonLoose(data.text || '{}');
      if (parsed.summary) return parsed as QuizAnalysis;
      return data.text || "Natijalar tahlil qilinmadi.";
    } catch (e) {
      console.error("Analyze Quiz Error:", e);
      return "Natijalar tahlilida xatolik yuz berdi.";
    }
  },

  /**
   * Suggests next steps/lessons for a given parent lesson.
   */
  async suggestLessons(
    parentLesson: GeneratedLesson,
    language: 'uz' | 'en' | 'ru',
    existingLessons: GeneratedLesson[] = []
  ): Promise<any[]> {
    const parentTopic = typeof parentLesson.topic === 'string'
      ? parentLesson.topic
      : getLocalizedValue(parentLesson.topic, language);

    const sectionTitles = (parentLesson.sections || []).map(s => {
      return typeof s.title === 'string' ? s.title : getLocalizedValue(s.title, language);
    });

    const existingTitles = existingLessons.map(l =>
      typeof l.topic === 'string' ? l.topic : getLocalizedValue(l.topic, language)
    ).filter(Boolean);

    const prompt = `
      You are an educational content advisor. 
      A student is learning about "${parentTopic}".
      The specific lesson on "${parentTopic}" covers these sections: ${sectionTitles.join(', ')}.

      Task: Suggest 4-5 high-quality next steps to DEEPEN knowledge specifically about "${parentTopic}".
      STRICT CONSTRAINTS:
      1. FOCUS ONLY: Your suggestions MUST be direct sub-topics, specific details, or immediate practical applications of "${parentTopic}".
      2. BE SPECIFIC: Avoid broad or "general" topics.
      3. NO DUPLICATES: Check existing lessons below and DO NOT suggest anything similar.
      4. LOGICAL HIERARCHY: Every suggestion MUST logically function as a "child" of "${parentTopic}".
      
      Existing lessons (DO NOT REPEAT):
      ${existingTitles.length > 0 ? existingTitles.map(t => `- ${t}`).join('\n') : 'None.'}

      Return JSON:
      {
        "suggestions": [
          { "id": "sug-1", "title": "Specific Sub-topic", "type": "lesson", "reason": "Deals with [X] detail of ${parentTopic}" }
        ]
      }
      Respond ONLY in ${getLangInstruction()}.
    `;

    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'gemini-2.5-flash',
          config: { responseMimeType: "application/json" }
        })
      });

      const data = await resp.json();
      reportUsage(data, 'gemini-2.5-flash', 'Mindmap Suggestions');

      const parsed = parseJsonLoose(data.text || '{}');
      return (parsed.suggestions || []).map((s: any, i: number) => ({
        ...s,
        id: s.id || `sug-${Date.now()}-${i}`,
        connectTo: parentLesson.id || ''
      }));
    } catch (e) {
      console.error("Suggest Lessons Error:", e);
      return [];
    }
  }
};

const getMockAnalysis = (): ExplainBackAnalysis => ({
  clarity: 75,
  accuracy: 80,
  completeness: 60,
  structure: 70,
  feedback: "Sinov natijasi.",
  correction: "Sinov tuzatish.",
  recommendations: ["Sinov tavsiyasi."]
});
