
import React, { useState } from 'react';
// For proper Markdown rendering, install react-markdown and remark-gfm:
// npm install react-markdown remark-gfm
// Then uncomment the following lines:
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import { generateQuestionPaper } from '../services/geminiService';
import { SUBJECTS, DIFFICULTIES, CLASS_LEVELS } from '../constants';
import type { QuestionPaperParams, Subject, Difficulty, ClassLevel } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Select from './common/Select';
import Input from './common/Input';
import Loader from './common/Loader';
import { Wand2 } from 'lucide-react';

const QuestionGenerator: React.FC = () => {
  const [params, setParams] = useState<QuestionPaperParams>({
    classLevel: '3',
    subject: 'Math',
    difficulty: 'Moderate',
    totalMarks: 50,
    sections: 3,
    marksPerQuestion: 5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const paper = await generateQuestionPaper(params);
      setResult(paper);
    } catch (err) {
      setError('Failed to generate question paper. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === 'totalMarks' || name === 'sections' || name === 'marksPerQuestion' ? parseInt(value, 10) : value,
    }));
  };

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Paper Configuration</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="classLevel" name="classLevel" label="Class" value={params.classLevel} onChange={handleChange}>
              {CLASS_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
            </Select>
            <Select id="subject" name="subject" label="Subject" value={params.subject} onChange={handleChange}>
              {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </Select>
          </div>
          
          <Select id="difficulty" name="difficulty" label="Difficulty" value={params.difficulty} onChange={handleChange}>
            {DIFFICULTIES.map(diff => <option key={diff} value={diff}>{diff}</option>)}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input id="totalMarks" name="totalMarks" label="Total Marks" value={params.totalMarks} onChange={handleChange} min="10" />
            <Input id="sections" name="sections" label="Sections" value={params.sections} onChange={handleChange} min="1" />
            <Input id="marksPerQuestion" name="marksPerQuestion" label="Marks/Ques" value={params.marksPerQuestion} onChange={handleChange} min="1" />
          </div>

          <Button onClick={handleGenerate} isLoading={isLoading} className="w-full mt-4" icon={<Wand2 size={18} />}>
            Generate Paper
          </Button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>

        {/* Result Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 min-h-[300px]">
          <h3 className="text-xl font-bold text-slate-800 mb-3">Generated Question Paper</h3>
          {isLoading && <Loader message="Generating your question paper..." />}
          {result && (
             // To render Markdown correctly, replace the <pre> tag with the following component:
             // <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
             //   {result}
             // </ReactMarkdown>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-white p-4 rounded-md overflow-x-auto">{result}</pre>
          )}
          {!isLoading && !result && (
            <div className="flex items-center justify-center h-full text-center text-slate-500">
              <p>Your generated question paper will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default QuestionGenerator;
