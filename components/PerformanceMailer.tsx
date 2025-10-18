import React, { useState, useMemo, useRef } from 'react';
import { generateFailureEmail } from '../services/geminiService';
import { FAILURE_THRESHOLD } from '../constants';
import type { Student } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { FileUp, Rocket, AlertTriangle, CheckCircle2, XCircle, Send, Loader2, MailCheck } from 'lucide-react';

declare var Papa: any;
declare var XLSX: any;

interface StudentWithEmail extends Student {
  emailContent: string;
  isGenerating: boolean;
  sendStatus: 'idle' | 'sending' | 'sent' | 'failed';
  sendError?: string;
}

const PerformanceMailer: React.FC = () => {
  const [failingStudents, setFailingStudents] = useState<StudentWithEmail[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result;
          let data: any[] = [];
          if (file.name.endsWith('.csv')) {
            const parsed = Papa.parse(fileContent as string, { header: false, skipEmptyLines: true });
            data = parsed.data;
          } else if (file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(fileContent, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          } else {
            throw new Error("Unsupported file type. Please upload a .csv or .xlsx file.");
          }

          const students: Student[] = data
            .map((row: any[], index: number) => {
              if (row.length < 5) return null;
              const [id, name, subject, marksStr, email] = row;
              const marks = parseInt(marksStr, 10);
              if (!id || !name || !subject || isNaN(marks) || !email) {
                 console.warn(`Skipping invalid row ${index + 1}:`, row);
                 return null;
              }
              return { id: String(id), name, subject, marks, email };
            })
            .filter((s): s is Student => s !== null);

          if (students.length === 0) {
            throw new Error("No valid student data found. Check file format: ID,Name,Subject,Marks,Email");
          }
          resolve(students);
        } catch (e: any) {
          reject(e);
        }
      };
      reader.onerror = (error) => reject(error);

      if (file.name.endsWith('.csv')) reader.readAsText(file);
      else if (file.name.endsWith('.xlsx')) reader.readAsBinaryString(file);
      else reject(new Error("Unsupported file type."));
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError('');
    setFailingStudents([]);
    setFileName(null);

    try {
      const allStudents = await parseFile(file);
      const failed = allStudents
        .filter(s => s.marks < FAILURE_THRESHOLD)
        .map(s => ({ ...s, emailContent: '', isGenerating: false, sendStatus: 'idle' as const }));
      setFailingStudents(failed);
      setFileName(file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file.');
    } finally {
      setIsParsing(false);
      // Reset file input value to allow re-uploading the same file
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateEmails = async () => {
    setIsGenerating(true);
    setFailingStudents(prev => prev.map(s => ({ ...s, isGenerating: true })));

    await Promise.all(failingStudents.map(async (student, index) => {
      try {
        const emailContent = await generateFailureEmail(student);
        setFailingStudents(prev => {
          const newStudents = [...prev];
          newStudents[index] = { ...newStudents[index], emailContent, isGenerating: false };
          return newStudents;
        });
      } catch (err) {
        setFailingStudents(prev => {
          const newStudents = [...prev];
          newStudents[index] = { ...newStudents[index], emailContent: 'Error generating email.', isGenerating: false };
          return newStudents;
        });
      }
    }));
    setIsGenerating(false);
  };

  const sendEmail = async (student: StudentWithEmail) => {
    try {
      const response = await fetch('http://localhost:3000/send-custom-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.name,
          email: student.email,
          subject: student.subject,
          message: student.emailContent,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send email.' }));
        throw new Error(errorData.message);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleSendAllEmails = async () => {
    setIsSending(true);
    for (const student of failingStudents) {
      if (student.emailContent && student.sendStatus === 'idle') {
        setFailingStudents(prev => prev.map(s => s.id === student.id ? { ...s, sendStatus: 'sending' } : s));
        const result = await sendEmail(student);
        setFailingStudents(prev => prev.map(s => s.id === student.id ? {
          ...s,
          sendStatus: result.success ? 'sent' : 'failed',
          sendError: result.success ? undefined : result.error,
        } : s));
      }
    }
    setIsSending(false);
  };
  
  const emailsGenerated = useMemo(() => failingStudents.length > 0 && failingStudents.every(s => s.emailContent), [failingStudents]);
  const emailsSentOrFailed = useMemo(() => failingStudents.length > 0 && failingStudents.every(s => s.sendStatus === 'sent' || s.sendStatus === 'failed'), [failingStudents]);

  const renderSendStatusIcon = (status: StudentWithEmail['sendStatus']) => {
    switch (status) {
      case 'sending': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'sent': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Upload File */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">1. Upload Student Data</h2>
          <div className="flex items-start p-2 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <AlertTriangle className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
            <p>Upload a <code className="bg-blue-100 p-1 rounded text-xs">.csv</code> or <code className="bg-blue-100 p-1 rounded text-xs">.xlsx</code> file with columns: <br /><strong className="font-mono">ID,Name,Subject,Marks,Email</strong></p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" id="file-upload" />
          <Button onClick={() => fileInputRef.current?.click()} isLoading={isParsing} icon={<FileUp size={18} />} className="w-full">
            {isParsing ? "Parsing File..." : "Choose File"}
          </Button>
          {fileName && <p className="text-sm text-slate-600 mt-3 text-center">File loaded: <strong>{fileName}</strong></p>}
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>

        {/* Steps 2 & 3: Generate and Send */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-3">2. Generate & Send Emails</h3>
          
          {failingStudents.length > 0 ? (
            <>
              <p className="text-sm text-slate-600 mb-4">Found <strong>{failingStudents.length}</strong> underperforming student(s). Proceed to generate email drafts.</p>
              <Button onClick={handleGenerateEmails} isLoading={isGenerating} disabled={emailsGenerated || isSending} className="w-full mb-4" icon={<Rocket size={18} />}>
                {isGenerating ? "Generating..." : (emailsGenerated ? "Drafts Generated" : "Generate Email Drafts")}
              </Button>
              {emailsGenerated && (
                <Button onClick={handleSendAllEmails} isLoading={isSending} disabled={emailsSentOrFailed} className="w-full mb-4 !bg-green-600 hover:!bg-green-700" icon={<Send size={18} />}>
                  {isSending ? "Sending..." : (emailsSentOrFailed ? "Emails Processed" : "Send All Emails")}
                </Button>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-center pt-8">Upload a file to begin.</p>
          )}

          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {failingStudents.map((student) => (
              <div key={student.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {renderSendStatusIcon(student.sendStatus)}
                    <p className="font-semibold text-slate-800">{student.name} ({student.subject})</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">{student.marks} Marks</span>
                </div>
                {student.isGenerating && <p className="text-sm text-blue-600 animate-pulse">Generating draft...</p>}
                {student.emailContent && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">To: {student.email}</p>
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-100 p-2 rounded">{student.emailContent}</pre>
                     {student.sendStatus === 'failed' && <p className="text-xs text-red-600 mt-1">Error: {student.sendError}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {emailsSentOrFailed && (
             <div className="flex items-center p-3 mt-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <MailCheck className="w-5 h-5 mr-3 flex-shrink-0" />
                <p>Email sending process complete. Check each student's status above.</p>
             </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PerformanceMailer;