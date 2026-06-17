// components/PromptSection.tsx
import React from 'react';

interface PromptSectionProps {
  isLoading: boolean;
  promptText: string;
  setPromptText: (text: string) => void;
  onExecute: (query: string) => void;
  onReset: () => void;
}

export const PromptSection: React.FC<PromptSectionProps> = ({ 
  isLoading, 
  promptText, 
  setPromptText, 
  onExecute, 
  onReset 
}) => {

  const handleExecute = () => {
    if (promptText.trim()) {
      onExecute(promptText);
    }
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <div className="border-x border-b border-slate-200 bg-slate-50/50 p-4 flex gap-4">
      <div className="flex-grow">
        <textarea
          placeholder="Enter Prompt to filter data"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          disabled={isLoading}
          className="w-full h-24 p-3 border border-slate-300 bg-white rounded-sm text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none disabled:opacity-75 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex flex-col gap-2 w-48 shrink-0">
        <button
          onClick={handleExecute}
          disabled={isLoading || !promptText.trim()}
          className="bg-[#111318] text-white py-2 px-4 rounded-full text-sm font-medium hover:bg-black transition-all flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Executing...' : 'Execute Prompt'}
        </button>
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="bg-[#111318] text-white py-2 px-4 rounded-full text-sm font-medium hover:bg-black transition-all disabled:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset Prompt
        </button>
      </div>
    </div>
  );
};