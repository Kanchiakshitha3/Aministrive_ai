
import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-100/50 rounded-lg">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="text-slate-700 font-semibold">{message}</p>
      <p className="text-sm text-slate-500">This may take a few moments...</p>
    </div>
  );
};

export default Loader;
