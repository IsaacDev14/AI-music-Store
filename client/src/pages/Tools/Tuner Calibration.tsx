import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cog6ToothIcon, 
  TrophyIcon, 
  ArrowDownTrayIcon, 
  MusicalNoteIcon, 
  ChartBarIcon, 
  BookOpenIcon,
  ArrowPathIcon,
  CommandLineIcon,
  KeyIcon,
  CpuChipIcon,
  SignalIcon,
  LockClosedIcon,
  LockOpenIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { NAVIGATION_PATHS } from '../../utils/constants';

// --- SETTINGS / PROFILE ---
export const LearningProfile: React.FC = () => (
  <div className="min-h-screen w-full bg-white p-4 md:p-6">
    <div className="max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4 mb-6">
         <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NEURAL PROFILE</h1>
         <p className="text-gray-500 font-mono text-xs mt-1">USER: GUEST // CONFIGURATION</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6 shadow-sm">
         <section>
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
               <MusicalNoteIcon className="w-4 h-4" /> Primary Interface
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {['Guitar', 'Piano', 'Bass', 'Drums'].map(i => (
                  <button key={i} className="p-4 rounded border border-gray-300 bg-gray-50 hover:border-blue-500 hover:text-blue-600 text-gray-700 font-medium transition-all text-sm uppercase tracking-wide">
                      {i}
                  </button>
               ))}
            </div>
         </section>
         <section>
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
               <ChartBarIcon className="w-4 h-4" /> Proficiency Matrix
            </h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
               <input type="range" min="0" max="100" className="w-full accent-blue-500 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
               <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-3 uppercase">
                  <span>Initiate</span>
                  <span>Virtuoso</span>
               </div>
            </div>
         </section>
         <div className="pt-4 border-t border-gray-200 flex justify-end">
           <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-500 shadow-sm transition-all text-sm uppercase tracking-wider">
               Save Configuration
           </button>
         </div>
      </div>
    </div>
  </div>
);

// --- CALIBRATION (Signal Generator) ---
export const TunerCalibration: React.FC = () => {
   const [pitch, setPitch] = useState(440);
   const [isPlaying, setIsPlaying] = useState(false);
   const [waveform, setWaveform] = useState<OscillatorType>('sine');
   const [volume, setVolume] = useState(0.5);
   
   const audioCtxRef = useRef<AudioContext | null>(null);
   const oscRef = useRef<OscillatorNode | null>(null);
   const gainRef = useRef<GainNode | null>(null);
   const analyserRef = useRef<AnalyserNode | null>(null);
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const animationRef = useRef<number>(0);

   useEffect(() => {
      const saved = localStorage.getItem('tuner_ref_pitch');
      if (saved) setPitch(parseInt(saved));
      return () => stopTone();
   }, []);

   useEffect(() => {
      if (oscRef.current) {
         oscRef.current.type = waveform;
      }
   }, [waveform]);

   useEffect(() => {
      if (gainRef.current && audioCtxRef.current) {
         gainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.1);
      }
   }, [volume]);

   // Real Oscilloscope Animation
   const draw = () => {
      const canvas = canvasRef.current;
      if(canvas) {
          const ctx = canvas.getContext('2d');
          if(ctx) {
              const width = canvas.width;
              const height = canvas.height;
              
              // Clean White Background
              ctx.fillStyle = '#ffffff'; 
              ctx.fillRect(0, 0, width, height);
              
              // Grid lines
              ctx.strokeStyle = '#e5e7eb';
              ctx.lineWidth = 1;
              ctx.beginPath();
              for(let x=0; x<width; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
              for(let y=0; y<height; y+=40) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
              ctx.stroke();

              if (isPlaying && analyserRef.current) {
                  const bufferLength = analyserRef.current.frequencyBinCount;
                  const dataArray = new Uint8Array(bufferLength);
                  analyserRef.current.getByteTimeDomainData(dataArray);

                  ctx.lineWidth = 2;
                  ctx.strokeStyle = '#2563eb'; // Blue
                  ctx.shadowBlur = 4;
                  ctx.shadowColor = '#2563eb';
                  ctx.beginPath();

                  const sliceWidth = width * 1.0 / bufferLength;
                  let x = 0;

                  for(let i = 0; i < bufferLength; i++) {
                      const v = dataArray[i] / 128.0;
                      const y = v * height/2;

                      if(i === 0) ctx.moveTo(x, y);
                      else ctx.lineTo(x, y);

                      x += sliceWidth;
                  }
                  ctx.stroke();
                  ctx.shadowBlur = 0;
              } else {
                  // Flat line when idle
                  ctx.strokeStyle = '#d1d5db';
                  ctx.beginPath();
                  ctx.moveTo(0, height/2);
                  ctx.lineTo(width, height/2);
                  ctx.stroke();
              }
          }
      }
      animationRef.current = requestAnimationFrame(draw);
   }

   useEffect(() => {
       draw();
       return () => cancelAnimationFrame(animationRef.current);
   }, [isPlaying]);

   const updatePitch = (newPitch: number) => {
      const clamped = Math.max(430, Math.min(450, newPitch));
      setPitch(clamped);
      localStorage.setItem('tuner_ref_pitch', clamped.toString());
      if (oscRef.current && audioCtxRef.current) {
         oscRef.current.frequency.setValueAtTime(clamped, audioCtxRef.current.currentTime);
      }
   };

   const toggleTone = () => {
      if (isPlaying) stopTone();
      else playTone();
   };

   const playTone = () => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      
      analyser.fftSize = 2048;
      osc.frequency.value = pitch;
      osc.type = waveform;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);
      
      osc.start();
      
      oscRef.current = osc;
      gainRef.current = gain;
      analyserRef.current = analyser;
      
      setIsPlaying(true);
   };

   const stopTone = () => {
      if (oscRef.current) {
         try { oscRef.current.stop(); } catch(e){}
         oscRef.current.disconnect();
         oscRef.current = null;
      }
      if (audioCtxRef.current) {
         audioCtxRef.current.close();
         audioCtxRef.current = null;
      }
      setIsPlaying(false);
   };

   return (
      <div className="min-h-screen w-full bg-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Device Chassis */}
          <div className="bg-white w-full rounded-lg shadow-lg border border-gray-200 overflow-hidden relative">
              {/* Rack Ears (Visual) */}
              <div className="absolute top-0 left-0 bottom-0 w-4 bg-gray-100 border-r border-gray-300 flex flex-col justify-between py-4 items-center">
                 <div className="w-2 h-2 rounded-full bg-gray-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"></div>
                 <div className="w-2 h-2 rounded-full bg-gray-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"></div>
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-gray-100 border-l border-gray-300 flex flex-col justify-between py-4 items-center">
                 <div className="w-2 h-2 rounded-full bg-gray-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"></div>
                 <div className="w-2 h-2 rounded-full bg-gray-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"></div>
              </div>

              {/* Main Panel */}
              <div className="mx-4 bg-white p-4 md:p-6">
                 {/* Header / Branding */}
                 <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-100 rounded border border-blue-200 text-blue-600">
                          <SignalIcon className="w-6 h-6" />
                       </div>
                       <div>
                          <h1 className="text-xl font-bold text-gray-900 tracking-widest uppercase font-mono">Signal Gen X-1</h1>
                          <p className="text-[10px] text-gray-500 font-mono">REFERENCE OSCILLATOR MODULE</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_blue]' : 'bg-gray-400'}`}></div>
                       <span className="text-[10px] font-bold text-gray-600 uppercase font-mono">{isPlaying ? 'Output Active' : 'Offline'}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Display & Visualizer */}
                    <div className="space-y-4">
                       {/* Digital Readout */}
                       <div className="bg-gray-50 rounded-lg border-2 border-gray-300 p-4 relative shadow-sm">
                             <div className="text-blue-600 font-mono text-4xl md:text-5xl font-black tracking-tighter text-right">
                                {pitch}<span className="text-lg md:text-xl text-gray-500 ml-2">Hz</span>
                             </div>
                             <div className="absolute top-2 left-3 text-[8px] text-gray-500 font-bold uppercase tracking-wider">Frequency</div>
                       </div>

                       {/* Oscilloscope */}
                       <div className="bg-gray-50 rounded-lg border-2 border-gray-300 h-40 md:h-48 relative overflow-hidden shadow-sm group">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30 pointer-events-none"></div>
                          <canvas ref={canvasRef} width={400} height={192} className="w-full h-full opacity-90" />
                          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-gray-400">OSC_VIEW_01</div>
                       </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-col justify-between space-y-4">
                       
                       {/* Frequency Control */}
                       <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-3 flex justify-between">
                                <span>Fine Tune</span>
                                <span className="text-blue-600 font-mono">{pitch} Hz</span>
                          </label>
                          <div className="relative h-8 mb-3">
                             <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 rounded-full transform -translate-y-1/2"></div>
                             <input 
                                type="range" 
                                min="430" 
                                max="450" 
                                value={pitch}
                                onChange={(e) => updatePitch(parseInt(e.target.value))}
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
                             />
                             <div 
                                className="absolute top-1/2 w-6 h-6 bg-white rounded border-2 border-gray-400 shadow-lg transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
                                style={{ left: `${((pitch - 430) / 20) * 100}%` }}
                             >
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-3 bg-gray-500"></div>
                             </div>
                          </div>
                          <div className="flex justify-between items-center">
                                <button onClick={() => updatePitch(pitch - 1)} className="w-8 h-8 md:w-10 md:h-10 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 font-bold border border-gray-300 shadow-sm">-</button>
                                <button onClick={() => updatePitch(440)} className="px-3 h-7 md:h-8 rounded bg-gray-100 text-gray-600 hover:text-blue-600 font-bold text-[10px] uppercase border border-gray-300">Reset Standard</button>
                                <button onClick={() => updatePitch(pitch + 1)} className="w-8 h-8 md:w-10 md:h-10 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 font-bold border border-gray-300 shadow-sm">+</button>
                          </div>
                       </div>

                       {/* Waveform Select */}
                       <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-3">Waveform Shape</label>
                          <div className="grid grid-cols-4 gap-2">
                                {['sine', 'square', 'sawtooth', 'triangle'].map((w) => (
                                   <button 
                                      key={w}
                                      onClick={() => setWaveform(w as OscillatorType)}
                                      className={`h-10 md:h-12 rounded flex items-center justify-center border transition-all active:scale-95 ${
                                         waveform === w 
                                         ? 'bg-blue-100 border-blue-500 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.15)]' 
                                         : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                      }`}
                                      title={w}
                                   >
                                      {/* Icons for waveforms */}
                                      {w === 'sine' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c5.5-10 8-10 10 0s4.5 10 10 0" /></svg>}
                                      {w === 'square' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h5V7h6v10h6v-5" /></svg>}
                                      {w === 'sawtooth' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17L12 7v10l8-10" /></svg>}
                                      {w === 'triangle' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17L12 7l9 10" /></svg>}
                                   </button>
                                ))}
                          </div>
                       </div>

                       {/* Master Power */}
                       <button 
                          onClick={toggleTone}
                          className={`w-full py-3 md:py-4 rounded-lg font-bold uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 active:translate-y-0.5 ${
                                isPlaying 
                                ? 'bg-red-600 hover:bg-red-500 text-white' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                       >
                          <Cog6ToothIcon className={`w-4 h-4 md:w-5 md:h-5 ${isPlaying ? 'animate-spin' : ''}`} />
                          {isPlaying ? 'Cut Signal' : 'Generate Signal'}
                       </button>
                    </div>
                 </div>
              </div>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center">
             <Link 
                to={NAVIGATION_PATHS['Instrument Tuner']} 
                className="text-gray-600 font-bold text-xs hover:text-blue-600 flex items-center justify-center gap-2 uppercase tracking-wider transition-colors"
             >
                <ArrowPathIcon className="w-4 h-4" /> Return to Tuner Interface
             </Link>
          </div>
        </div>
      </div>
   );
};

// --- ACHIEVEMENTS ---
export const Achievements: React.FC = () => (
   <div className="min-h-screen w-full bg-white p-4 md:p-6">
     <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
           <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Badges & Milestones</h1>
              <p className="text-gray-500 text-sm mt-1 font-mono">USER_PROGRESS: 15% COMPLETE</p>
           </div>
           <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded border border-gray-300">
               <TrophyIcon className="w-5 h-5 text-yellow-500" />
               <span className="text-gray-900 font-bold">Rank: NOVICE</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
           {[
              { title: 'Initiate', desc: 'Logged first session', unlocked: true, icon: SignalIcon, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300' },
              { title: 'Consistency', desc: '7 day streak active', unlocked: true, icon: ArrowPathIcon, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300' },
              { title: 'Composer', desc: 'Wrote 5 songs with AI', unlocked: false, icon: MusicalNoteIcon, color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-300' },
              { title: 'Metronome', desc: '1 hour rhythm practice', unlocked: false, icon: CpuChipIcon, color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-300' },
              { title: 'Analyst', desc: 'Analyzed 10 songs', unlocked: false, icon: BookOpenIcon, color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-300' },
              { title: 'Virtuoso', desc: '100 practice hours', unlocked: false, icon: TrophyIcon, color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-300' },
           ].map((a, i) => (
              <div key={i} className={`p-4 md:p-6 rounded-xl border ${a.unlocked ? `${a.bg} ${a.border}` : 'bg-gray-50 border-gray-300'} relative overflow-hidden group`}>
                 {a.unlocked && <div className={`absolute inset-0 opacity-10 ${a.bg}`}></div>}
                 <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center border ${a.unlocked ? 'border-white/20' : 'border-gray-300'} ${a.bg}`}>
                       <a.icon className={`w-5 h-5 md:w-6 md:h-6 ${a.color}`} />
                    </div>
                    {a.unlocked ? <LockOpenIcon className="w-4 h-4 text-gray-500" /> : <LockClosedIcon className="w-4 h-4 text-gray-400" />}
                 </div>
                 <h3 className={`font-bold text-base md:text-lg ${a.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{a.title}</h3>
                 <p className="text-xs text-gray-500 mt-1 font-mono">{a.desc}</p>
              </div>
           ))}
        </div>
     </div>
   </div>
);

// --- EXPORT ---
export const DataExport: React.FC = () => (
   <div className="min-h-screen w-full bg-white p-4 md:p-6 flex items-center justify-center">
     <div className="max-w-xl w-full">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
           
           <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-gray-300 shadow-sm relative group">
               <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping"></div>
               <ServerIcon className="w-8 h-8 md:w-10 md:h-10 text-blue-600 relative z-10" />
           </div>
           
           <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Data Export</h1>
           <p className="text-gray-500 mb-6 text-sm font-mono">DOWNLOAD YOUR STUDIO SESSIONS AND PROGRESS DATA</p>
           
           <div className="space-y-3">
               <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 py-3 md:py-4 rounded font-bold flex items-center justify-center gap-2 transition-all group">
                  <ArrowDownTrayIcon className="w-4 h-4 md:w-5 md:h-5 group-hover:animate-bounce" />
                  DOWNLOAD JSON DATA
               </button>
               <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 py-3 md:py-4 rounded font-bold flex items-center justify-center gap-2 transition-all">
                  <ArrowDownTrayIcon className="w-4 h-4 md:w-5 md:h-5" />
                  DOWNLOAD CSV REPORT
               </button>
           </div>
           
           <div className="mt-4 text-[10px] text-gray-400 font-mono">
              SECURE CONNECTION // 256-BIT ENCRYPTION
           </div>
        </div>
     </div>
   </div>
);

// --- SHORTCUTS ---
export const Shortcuts: React.FC = () => (
   <div className="min-h-screen w-full bg-white p-4 md:p-6">
     <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
           <CommandLineIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
           <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Command Matrix</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
           <div className="grid grid-cols-2 bg-gray-50 p-3 md:p-4 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-widest">
              <div>Action / Function</div>
              <div className="text-right">Key Binding</div>
           </div>
           {[
              { key: 'Space', action: 'Toggle Playback / Metronome' },
              { key: '⌘ + K', action: 'Global Search' },
              { key: 'Shift + N', action: 'Create New Session' },
              { key: 'Esc', action: 'Close Panels / Modals' },
              { key: 'R', action: 'Quick Record Toggle' },
              { key: 'M', action: 'Mute All Audio' },
           ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors group">
                 <div className="text-gray-700 font-medium flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-blue-500 transition-colors"></div>
                    {s.action}
                 </div>
                 <div className="flex items-center gap-1">
                    <KeyIcon className="w-4 h-4 text-gray-500 mr-2" />
                    <kbd className="bg-gray-100 border border-gray-300 rounded px-2 md:px-3 py-1 text-xs font-mono font-bold text-blue-600 shadow-sm min-w-[2.5rem] md:min-w-[3rem] text-center">
                       {s.key}
                    </kbd>
                 </div>
              </div>
           ))}
        </div>
     </div>
   </div>
);