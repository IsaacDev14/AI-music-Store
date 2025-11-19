import React, { useState, useRef, useEffect } from 'react';
import { getImprovTips } from '../../api/apiService';
import { 
  PaperAirplaneIcon, 
  SparklesIcon, 
  MusicalNoteIcon, 
  LightBulbIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  FireIcon
} from '@heroicons/react/24/solid';

const ImprovAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    setShowIntro(false);
    setLoading(true);
    setLastQuery(input);
    setResponse(''); // Clear previous response
    
    const result = await getImprovTips(input);
    setResponse(result);
    setLoading(false);
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setShowIntro(false);
    setLoading(true);
    setLastQuery(prompt);
    setResponse('');
    
    getImprovTips(prompt).then(result => {
        setResponse(result);
        setLoading(false);
    });
    setInput('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [response, loading, lastQuery]);

  const SUGGESTIONS = [
    { label: "Blues in A Minor", icon: MusicalNoteIcon, color: "bg-blue-100 text-blue-600" },
    { label: "Jazz ii-V-I in C", icon: SparklesIcon, color: "bg-purple-100 text-purple-600" },
    { label: "Dorian Mode Funk", icon: FireIcon, color: "bg-orange-100 text-orange-600" },
    { label: "Spanish Phrygian", icon: LightBulbIcon, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className=" w-screen flex flex-col bg-white overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm flex-none z-10">
         <div className="w-full flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-blue-200 shadow-lg">
               <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </div>
            <div>
               <h1 className="text-xl font-bold text-gray-900">Improv Coach</h1>
               <p className="text-xs text-gray-500 font-medium">AI-powered theory & technique advice</p>
            </div>
         </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth min-h-0" ref={chatContainerRef}>
           <div className="w-full max-w-6xl mx-auto space-y-8 min-w-0">
              
              {/* INTRO HERO */}
              {showIntro && (
                 <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-fade-in w-full">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-white rounded-full flex items-center justify-center mb-6 border border-blue-100 shadow-inner">
                       <LightBulbIcon className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Stuck in a rut?</h2>
                    <p className="text-gray-500 max-w-md mb-8">
                       Tell me the chords, key, or style you're playing, and I'll suggest scales, target notes, and rhythmic ideas.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
                       {SUGGESTIONS.map((s) => (
                          <button 
                             key={s.label}
                             onClick={() => handleQuickPrompt(s.label)}
                             className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left group min-w-0"
                          >
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                <s.icon className="w-5 h-5" />
                             </div>
                             <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate">{s.label}</span>
                          </button>
                       ))}
                    </div>
                 </div>
              )}

              {/* CONVERSATION HISTORY */}
              {!showIntro && (
                 <div className="space-y-8 pb-4 w-full min-w-0">
                    {/* USER MESSAGE */}
                    <div className="flex justify-end w-full">
                       <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl rounded-tr-none shadow-lg max-w-[85%] lg:max-w-[70%] animate-fade-in min-w-0">
                          <p className="font-medium break-words">{lastQuery}</p>
                       </div>
                    </div>

                    {/* AI RESPONSE */}
                    {(loading || response) && (
                       <div className="flex gap-4 animate-fade-in w-full min-w-0">
                          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                             {loading ? (
                                <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
                             ) : (
                                <SparklesIcon className="w-5 h-5 text-blue-500" />
                             )}
                          </div>
                          
                          <div className="bg-white border border-gray-200 p-6 rounded-2xl rounded-tl-none shadow-sm w-full max-w-[90%] min-w-0">
                             {loading ? (
                                <div className="flex items-center gap-1 h-6">
                                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                             ) : (
                                <div className="prose prose-blue max-w-none min-w-0">
                                   <div className="whitespace-pre-wrap text-gray-700 leading-relaxed break-words">
                                      {response.split('\n').map((line, i) => {
                                         // Simple formatting for bold/headers
                                         if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().endsWith(':')) {
                                            return <p key={i} className="font-bold text-gray-900 mt-4 mb-2">{line}</p>
                                         }
                                         return <p key={i} className="mb-2">{line}</p>
                                      })}
                                   </div>
                                   
                                   <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2 flex-wrap">
                                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        Theory
                                      </span>
                                      <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                        Technique
                                      </span>
                                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                                        Scales
                                      </span>
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>
                    )}
                 </div>
              )}
           </div>
        </div>

        {/* INPUT BAR */}
        <div className="p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 transition-colors flex-none">
           <div className="w-full max-w-6xl mx-auto relative min-w-0">
              <form onSubmit={handleAsk} className="relative group">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your context (e.g. 'Fast Bebop in Bb')..."
                    className="w-full pl-6 pr-16 py-4 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none text-gray-900 font-medium placeholder-gray-500 shadow-sm min-w-0"
                 />
                 <button 
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                 >
                    <PaperAirplaneIcon className="w-5 h-5" />
                 </button>
              </form>
              <div className="text-center mt-2">
                 <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Gemini Music Engine</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovAssistant;