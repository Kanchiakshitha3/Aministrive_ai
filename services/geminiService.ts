
import { GoogleGenAI } from "@google/genai";
import type { QuestionPaperParams, Student } from '../types';

// IMPORTANT: This check is to prevent crashing in environments where process.env is not defined.
const apiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY
  ? process.env.API_KEY
  : undefined;

if (!apiKey) {
  console.warn("API_KEY environment variable not set. Please set it to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || " " });

export const generateQuestionPaper = async (params: QuestionPaperParams): Promise<string> => {
  if (!apiKey) return "API Key not configured. Please set the API_KEY environment variable.";

  const { classLevel, subject, difficulty, totalMarks, sections, marksPerQuestion } = params;

  const prompt = `
    Generate a formatted question paper for a student in Class ${classLevel}.

    **Subject:** ${subject}
    **Difficulty Level:** ${difficulty}
    **Total Marks:** ${totalMarks}
    
    **Instructions:**
    1.  The question paper must have exactly ${sections} sections.
    2.  Each question should be worth approximately ${marksPerQuestion} marks. Adjust the number of questions to be close to the total marks.
    3.  The questions must be age-appropriate for a Class ${classLevel} student.
    4.  Format the output clearly using Markdown. Use headings for sections, and numbered lists for questions.
    5.  For Math, include a mix of problem types. For other subjects, include various question formats (e.g., multiple choice, fill in the blanks, short answer).
    6.  Ensure the total marks of all questions sum up to ${totalMarks}.
    7.  Do not include an answer key.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating question paper:", error);
    return "An error occurred while generating the question paper. Please check the console for details.";
  }
};

export const generateFailureEmail = async (student: Student): Promise<string> => {
    if (!apiKey) return "API Key not configured. Please set the API_KEY environment variable.";

    const { name, subject, marks } = student;

    const prompt = `
    Write a polite, encouraging, and professional email to a student's parents about their low performance in an exam.

    **Student's Name:** ${name}
    **Subject:** ${subject}
    **Marks Obtained:** ${marks}
    **Passing Marks:** ${30}

    **Email Tone:** Supportive and constructive, not punitive.
    **Goal:** Inform the parents and suggest a collaborative approach for improvement.

    **Structure:**
    1.  Start with a polite greeting.
    2.  State the purpose of the email: to discuss ${name}'s recent performance in ${subject}.
    3.  Mention the marks obtained (${marks}) and clarify that it is below the passing score.
    4.  Express belief in the student's potential and willingness to help them improve.
    5.  Suggest scheduling a meeting to discuss strategies for improvement.
    6.  End with a professional closing.

    Do not include a subject line in the body. Just generate the email content.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating email:", error);
        return `An error occurred while generating the email for ${name}.`;
    }
};
