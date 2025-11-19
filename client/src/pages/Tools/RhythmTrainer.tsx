import React, { useState } from 'react';
import { generateRhythmPattern } from '../../api/apiService';
import { PlayIcon, ArrowPathIcon, CpuChipIcon, Square2StackIcon } from '@heroicons/react/24/solid';

const RhythmTrainer: React.FC = () => {
  const [timeSig, setTimeSig] = useState('4/4');
  const [level, setLevel] = useState('Beginner');
  const [pattern, setPattern] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateRhythmPattern(timeSig, level);
    setPattern(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-white overflow-hidden">
       
       {/* Header - Fixed */}
       <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-none shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-50 rounded border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Square2StackIcon className="w-5 h-5" />
             </div>
             <div>
                <h1 className="text-lg font-bold text-gray-900">Rhythm Core</h1>
                <p className="text-xs text-gray-500 font-mono">NEURAL PATTERN GENERATOR</p>
             </div>
          </div>
          <div className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
             V.2.1.0
          </div>
       </div>

       {/* Main Content - Scrollable */}
       <div className="flex-1 overflow-y-auto">
          <div className="p-4 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               
               {/* Left Control Panel */}
               <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                     <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CpuChipIcon className="w-4 h-4" /> Configuration
                     </h3>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-semibold text-gray-700 mb-2">Time Signature</label>
                           <div className="grid grid-cols-2 gap-2">
                              {['4/4', '3/4', '6/8', '5/4'].map(ts => (
                                 <button 
                                    key={ts}
                                    onClick={() => setTimeSig(ts)}
                                    className={`py-2 text-sm font-medium rounded border transition-all ${
                                      timeSig === ts 
                                        ? 'bg-indigo-500 border-indigo-600 text-white shadow-md' 
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                 >
                                    {ts}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-semibold text-gray-700 mb-2">Complexity Level</label>
                           <select 
                              value={level}
                              onChange={(e) => setLevel(e.target.value)}
                              className="w-full bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            >
                              <option>Beginner</option>
                              <option>Intermediate</option>
                              <option>Advanced</option>
                              <option>Expert (Polyrhythmic)</option>
                            </select>
                        </div>
                     </div>

                     <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none disabled:shadow-none"
                     >
                        {loading ? (
                           <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                           <PlayIcon className="w-5 h-5" />
                        )}
                        {loading ? 'GENERATING...' : 'GENERATE PATTERN'}
                     </button>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 font-medium leading-relaxed">
                     <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${pattern ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="font-semibold">
                           {pattern ? 'PATTERN READY' : 'AWAITING INPUT'}
                        </span>
                     </div>
                     <p className="text-gray-500 text-sm">
                       {pattern 
                          ? 'Rhythm pattern generated successfully. Practice the sequence above.' 
                          : 'Configure settings and generate a rhythm pattern to begin training.'
                       }
                     </p>
                  </div>
               </div>

               {/* Right Visualizer Panel */}
               <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-xl border-2 border-gray-200 relative overflow-hidden flex flex-col min-h-[300px] shadow-sm">
                     {/* Grid Background */}
                     <div className="absolute inset-0 opacity-30" 
                          style={{ 
                            backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', 
                            backgroundSize: '24px 24px' 
                          }}>
                     </div>
                     
                     {/* Visualizer Header */}
                     <div className="relative z-10 bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                        <div className="text-xs font-semibold text-indigo-600">PATTERN VISUALIZER</div>
                        <div className="flex gap-1">
                           <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : pattern ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                           <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                           <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        </div>
                     </div>

                     {/* Pattern Display */}
                     <div className="relative z-10 flex-1 flex items-center justify-center p-6">
                        {loading ? (
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                              <div className="text-sm font-medium text-indigo-600 animate-pulse">
                                 Generating Rhythm Pattern...
                              </div>
                           </div>
                        ) : pattern ? (
                           <div className="w-full space-y-6">
                              {/* Main Pattern Display */}
                              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-md relative overflow-hidden group hover:shadow-lg transition-shadow">
                                 <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 to-purple-500 opacity-80"></div>
                                 <div className="text-xl md:text-2xl font-mono font-bold text-gray-800 text-center leading-relaxed tracking-wider">
                                    {pattern}
                                 </div>
                                 <div className="absolute bottom-2 right-2 text-xs text-gray-400 font-mono">
                                    {timeSig} • {level}
                                 </div>
                              </div>
                              
                              {/* Visual Rhythm Indicator */}
                              <div className="flex justify-center gap-1">
                                 {Array.from({length: 16}).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`w-3 h-8 rounded-sm transition-all duration-300 ${
                                        i % 4 === 0 
                                          ? 'bg-indigo-500 shadow-md' 
                                          : i % 2 === 0 
                                            ? 'bg-purple-400' 
                                            : 'bg-indigo-300'
                                      } animate-pulse`} 
                                      style={{ 
                                        animationDelay: i * 0.1 + 's',
                                        animationDuration: '1.5s'
                                      }}
                                    ></div>
                                 ))}
                              </div>
                           </div>
                        ) : (
                           <div className="text-center text-gray-400">
                              <Square2StackIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                              <div className="text-lg font-semibold text-gray-500 mb-1">No Pattern Generated</div>
                              <div className="text-sm text-gray-400 max-w-sm">
                                 Configure your settings and click "Generate Pattern" to create a rhythm sequence.
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Footer Stats */}
                     <div className="relative z-10 bg-gray-50 border-t border-gray-200 px-4 py-2 flex justify-between items-center text-xs text-gray-600 font-medium">
                        <span>Signature: <span className="font-bold text-indigo-600">{timeSig}</span></span>
                        <span>Level: <span className="font-bold text-indigo-600">{level}</span></span>
                        <span>Status: <span className="font-bold text-indigo-600">{loading ? 'Processing' : pattern ? 'Ready' : 'Idle'}</span></span>
                     </div>
                  </div>

                  {/* Practice Tips */}
                  {pattern && !loading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                       <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <PlayIcon className="w-4 h-4" />
                          Practice Tips
                       </h4>
                       <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Start slow and gradually increase tempo</li>
                          <li>• Use a metronome to maintain steady timing</li>
                          <li>• Break complex patterns into smaller sections</li>
                          <li>• Focus on consistency before speed</li>
                       </ul>
                    </div>
                  )}
               </div>

            </div>
          </div>
       </div>
    </div>
  );
};

export default RhythmTrainer;