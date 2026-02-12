import React from 'react';
import { BookOpen, X, Download, Copy, Check } from 'lucide-react';

interface StudyPlanModalProps {
  studyPlan: string;
  subject: string;
  onClose: () => void;
}

const StudyPlanModal: React.FC<StudyPlanModalProps> = ({ studyPlan, subject, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  // Only detect actual error messages from the service (more specific check)
  const isError = studyPlan.startsWith('Study plan generation failed');

  const handleCopy = () => {
    navigator.clipboard.writeText(studyPlan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([studyPlan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject}-study-plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-blue-500 p-10 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">Study Plan</h3>
              <p className="text-blue-100 text-sm font-bold mt-1">{subject}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10">
          {isError ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X size={20} />
                </div>
                <h4 className="font-bold text-red-900 text-lg">Generation Failed</h4>
              </div>
              <div className="text-sm text-red-800 leading-relaxed whitespace-pre-wrap font-medium">
                {studyPlan}
              </div>
            </div>
          ) : (
            <div className="prose prose-blue max-w-none">
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {studyPlan}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Close
          </button>
          {!isError && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanModal;
