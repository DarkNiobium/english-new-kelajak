/**
 * Safely parses JSON from AI responses that might contain markdown blocks, 
 * leading/trailing text, or other common LLM artifacts.
 */
export function parseJsonLoose<T>(text: string): T | null {
  if (!text) return null;

  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try to extract from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        // Continue to step 3
      }
    }

    // 3. Try finding the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (e3) {
        // Continue to final attempts
      }
    }

    // 4. Try cleaning problematic characters (like newlines in strings)
    // This is a last resort and can be risky.
    try {
      const cleaned = text
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .trim();
      
      const first = cleaned.indexOf('{');
      const last = cleaned.lastIndexOf('}');
      if (first !== -1 && last !== -1) {
        return JSON.parse(cleaned.substring(first, last + 1));
      }
    } catch (e4) {
      // Failed all attempts
    }
  }

  return null;
}
