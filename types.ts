
export type Subject = 'Science' | 'Math' | 'Social' | 'English';
export type Difficulty = 'Easy' | 'Moderate' | 'Hard';
export type ClassLevel = '1' | '2' | '3' | '4' | '5';

export interface QuestionPaperParams {
  classLevel: ClassLevel;
  subject: Subject;
  difficulty: Difficulty;
  totalMarks: number;
  sections: number;
  marksPerQuestion: number;
}

export interface Student {
  id: string;
  name: string;
  subject: string;
  marks: number;
  email: string;
}
