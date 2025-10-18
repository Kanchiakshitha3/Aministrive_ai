
import React, { useState } from 'react';
import QuestionGenerator from './components/QuestionGenerator';
import PerformanceMailer from './components/PerformanceMailer';
import { BookOpen, Mail, Zap } from 'lucide-react';

type ActiveView = 'generator' | 'mailer';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('generator');

  const NavButton: React.FC<{
    view: ActiveView;
    label: string;
    icon: React.ReactNode;
  }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out ${
        activeView === view
          ? 'bg-blue-600 text-white shadow-lg transform -translate-y-1'
          : 'bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-2">
            <Zap className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Administrative AI Agent</h1>
          </div>
          <p className="text-slate-600">Your smart assistant for educational tasks.</p>
        </header>

        <nav className="flex justify-center items-center gap-4 p-2 bg-white/50 backdrop-blur-sm rounded-full shadow-md mb-8 sticky top-4 z-10">
          <NavButton view="generator" label="Question Paper Generator" icon={<BookOpen size={16} />} />
          <NavButton view="mailer" label="Performance Mailer" icon={<Mail size={16} />} />
        </nav>

        <main>
          {activeView === 'generator' && <QuestionGenerator />}
          {activeView === 'mailer' && <PerformanceMailer />}
        </main>

        <footer className="text-center mt-12 text-sm text-slate-500">
          <p>Powered by Gemini API. Built for modern educators.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
