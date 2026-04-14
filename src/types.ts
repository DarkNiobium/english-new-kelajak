
export type KnowledgeLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LearningGoal = 'theoretical' | 'practical' | 'professional';

export interface VocabularyItem {
  term: string;
  definition: string;
}

export interface LessonSection {
  title: string;
  content: string;
  type: 'concept' | 'exercise' | 'summary' | 'example';
}

export interface GeneratedLesson {
  topic: string;
  level: KnowledgeLevel;
  goal: LearningGoal;
  sections: LessonSection[];
  vocabulary: VocabularyItem[];
  sources: string[];
}
