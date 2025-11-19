import React, { useState } from 'react';
import { generateMelodySuggestion } from '../../api/apiService';
import { 
  MusicalNoteIcon, 
  SparklesIcon, 
  AdjustmentsHorizontalIcon, 
  PlayCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/solid';

interface MelodyHistoryItem {
  key: string;
  style: string;
  content: string;
  timestamp: Date;
}

const MelodyGenerator: React.FC = () => {
  const [key, setKey] = useState('C Major');
  const [style, setStyle] = useState('Pop');
  const [melody, setMelody] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MelodyHistoryItem[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateMelodySuggestion(key, style);
    setMelody(result);
    
    // Add to history
    if (result) {
      setHistory(prev => [{
        key, 
        style, 
        content: result, 
        timestamp: new Date()
      }, ...prev]);
    }
    
    setLoading(false);
  };

  const loadFromHistory = (item: MelodyHistoryItem) => {
    setKey(item.key);
    setStyle(item.style);
    setMelody(item.content);
  };

  const copyToClipboard = () => {
    if (melody) navigator.clipboard.writeText(melody);
  };

  // Piano Roll Decorative Background (Fixed Position)
  const PianoRollBg = () => (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-white">
       {/* Horizontal Rows (Notes) */}
       <div className="absolute inset-0 flex flex-col">
          {Array.from({ length: 24 }).map((_, i) => (
             <div key={`row-${i}`} className={`flex-1 border-b border-gray-900 ${[1,3,6,8,10,13,15,18,20,22].includes(i) ? 'bg-gray-900/5' : ''}`}></div>
          ))}
       </div>
       {/* Vertical Columns (Beats) */}
       <div className="absolute inset-0 flex">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`col-${i}`} className={`flex-1 border-r ${i % 4 === 0 ? 'border-gray-900/20' : 'border-gray-900/5'}`}></div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-white overflow-hidden">
      
      {/* LEFT SIDEBAR CONTROLS */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-full">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100 flex-none">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm">
               <MusicalNoteIcon className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Melody Spark</h1>
          </div>
          <p className="text-xs text-gray-500 ml-11">AI Motif Generator</p>
        </div>

        {/* Sidebar Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">
          
          {/* Controls Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <AdjustmentsHorizontalIcon className="w-4 h-4" /> Generator Config
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Musical Key</label>
                    <input 
                        type="text" 
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="w-full border-gray-200 bg-gray-50 rounded-lg p-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none placeholder-gray-400 min-w-0"
                        placeholder="e.g. F# Minor"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Style / Genre</label>
                    <div className="relative">
                      <select 
                          value={style}
                          onChange={(e) => setStyle(e.target.value)}
                          className="w-full border-gray-200 bg-gray-50 rounded-lg p-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer min-w-0"
                      >
                          <option>Pop</option>
                          <option>Cinematic</option>
                          <option>Jazz</option>
                          <option>R&B</option>
                          <option>Lo-Fi</option>
                          <option>Classical</option>
                          <option>Rock</option>
                          <option>EDM</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-rose-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none disabled:shadow-none mt-2 min-w-0"
            >
              {loading ? (
                  <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Thinking...
                  </>
              ) : (
                  <>
                      <SparklesIcon className="w-5 h-5 text-rose-100" />
                      Generate Idea
                  </>
              )}
            </button>
          </div>

          {/* History Section */}
          {history.length > 0 && (
             <div className="space-y-4 pt-4 border-t border-gray-100 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Session History</span>
                    <button onClick={() => setHistory([])} className="text-gray-300 hover:text-rose-500"><TrashIcon className="w-3 h-3" /></button>
                </div>
                <div className="space-y-2 min-w-0">
                   {history.map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-rose-200 hover:bg-rose-50 transition-all group bg-white min-w-0"
                      >
                         <div className="flex justify-between items-center mb-1 min-w-0">
                            <span className="text-xs font-bold text-gray-700 truncate">{item.key}</span>
                            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                         <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide group-hover:text-rose-600 truncate">{item.style}</div>
                      </button>
                   ))}
                </div>
             </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 text-center bg-gray-50 flex-none">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gemini 2.5 Flash Audio Model</p>
        </div>
      </div>

      {/* RIGHT RESULT AREA */}
      <div className="flex-1 bg-gray-50/50 flex flex-col min-h-0 overflow-hidden">
        
        {/* Header Actions */}
        <div className="flex justify-end p-4 md:p-6 flex-none">
            {melody && (
                <button 
                    onClick={copyToClipboard}
                    className="bg-white text-gray-600 px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:border-rose-300 hover:text-rose-600 shadow-sm flex items-center gap-2 transition-all uppercase tracking-wide flex-shrink-0"
                >
                    <DocumentDuplicateIcon className="w-4 h-4" /> Copy Text
                </button>
            )}
        </div>

        {/* Main Content Card */}
        <div className="flex-1 bg-white rounded-t-2xl md:rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-200 relative overflow-hidden flex flex-col min-h-0 mx-4 md:mx-6 mb-4 md:mb-6">
            
            {/* Top Bar of Card */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between z-20 relative flex-none">
                <div className="flex items-center gap-2 min-w-0">
                   <div className="flex gap-1.5 mr-4 flex-shrink-0">
                       <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                   </div>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">Editor View</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                   <span className="px-3 py-1 bg-rose-50 rounded-full border border-rose-100 text-[10px] font-bold text-rose-600 uppercase tracking-wide truncate max-w-24">
                      {key}
                   </span>
                   <span className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-24">
                      {style}
                   </span>
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="relative flex-1 w-full h-full min-h-0">
                {/* Fixed Background (Parallax Effect) */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <PianoRollBg />
                </div>
                
                {/* Scrolling Content */}
                <div className="absolute inset-0 overflow-y-auto p-4 md:p-8 z-10 min-w-0">
                    {melody ? (
                        <div className="relative w-full mx-auto animate-fade-in pb-8 min-w-0">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border-l-4 border-rose-500 p-6 md:p-8 shadow-sm ring-1 ring-gray-100 min-w-0">
                                <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2 border-b border-rose-100 pb-3 md:pb-4">
                                    <PlayCircleIcon className="w-4 h-4 md:w-5 md:h-5" /> AI Suggestion Output
                                </h3>
                                <p className="whitespace-pre-wrap font-medium text-gray-800 leading-relaxed text-base md:text-lg font-serif min-w-0 break-words">
                                    {melody}
                                </p>
                            </div>

                            {/* Decorative Visuals at bottom of scroll */}
                            <div className="mt-8 md:mt-12 flex items-center justify-center gap-1 opacity-20">
                                {Array.from({length: 12}).map((_, i) => (
                                    <div key={i} className="w-1 bg-gray-900 rounded-full" style={{ height: Math.random() * 24 + 8 + 'px' }}></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 select-none min-h-[300px] md:min-h-[400px] p-4">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner border border-gray-100 flex-shrink-0">
                                <MusicalNoteIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-gray-700 mb-2 text-center">Canvas Empty</h3>
                            <p className="text-xs text-gray-400 max-w-xs text-center uppercase tracking-wide font-medium">
                                Configure settings on the left sidebar to initialize generation.
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default MelodyGenerator;