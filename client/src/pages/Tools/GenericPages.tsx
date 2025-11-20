/* eslint-disable */

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
  <div className="max-w-4xl mx-auto p-8">
    <div className="border-b border-gray-200 pb-6 mb-8">
       <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Neural Profile</h1>
       <p className="text-gray-500 font-mono text-xs mt-1">USER: GUEST // CONFIGURATION</p>
    </div>
    
    <div className="bg-white p-8 rounded-xl border border-gray-200 space-y-8 shadow-sm">
       <section>
          <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <MusicalNoteIcon className="w-4 h-4" /> Primary Interface
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {['Guitar', 'Piano', 'Bass', 'Drums'].map(i => (
                <button key={i} className="p-4 rounded border border-gray-200 bg-gray-50 hover:border-indigo-500 hover:text-indigo-600 text-gray-600 font-medium transition-all text-sm uppercase tracking-wide">
                    {i}
                </button>
             ))}
          </div>
       </section>
       <section>
          <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <ChartBarIcon className="w-4 h-4" /> Proficiency Matrix
          </h2>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
             <input type="range" min="0" max="100" className="w-full accent-indigo-500 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
             <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-3 uppercase">
                <span>Initiate</span>
                <span>Virtuoso</span>
             </div>
          </div>
       </section>
       <div className="pt-6 border-t border-gray-100 flex justify-end">
         <button className="bg-indigo-600 text-white px-8 py-3 rounded font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-200 transition-all text-sm uppercase tracking-wider">
             Save Configuration
         </button>
       </div>
    </div>
  </div>
);

// --- CALIBRATION (Signal Generator) ---
export const TunerCalibration: React.FC = () => {
   const [pitch, setPitch] = useState(440);
   const [isPlaying, setIsPlaying] = useState(false);
   const [waveform, setWaveform] = useState<OscillatorType>('sine');
   const [volume] = useState(0.5);
   
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

   const draw = () => {
      const canvas = canvasRef.current;
      if(canvas) {
          const ctx = canvas.getContext('2d');
          if(ctx) {
              const width = canvas.width;
              const height = canvas.height;
              
              // Clean light background
              ctx.fillStyle = '#f1f5f9'; 
              ctx.fillRect(0, 0, width, height);
              
              // Grid lines
              ctx.strokeStyle = '#cbd5e1';
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
                  ctx.strokeStyle = '#0ea5e9'; // Sky blue
                  ctx.shadowBlur = 0;
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
              } else {
                  ctx.strokeStyle = '#94a3b8';
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
      <div className="max-w-4xl mx-auto p-6 md:p-10 flex flex-col items-center">
         {/* Device Chassis (Silver Aluminum) */}
         <div className="bg-gray-200 w-full rounded-lg shadow-2xl border border-gray-300 overflow-hidden relative">
            {/* Rack Ears */}
            <div className="absolute top-0 left-0 bottom-0 w-4 bg-gray-300 border-r border-gray-400 flex flex-col justify-between py-4 items-center">
               <div className="w-2 h-2 rounded-full bg-gray-400 shadow-inner"></div>
               <div className="w-2 h-2 rounded-full bg-gray-400 shadow-inner"></div>
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-4 bg-gray-300 border-l border-gray-400 flex flex-col justify-between py-4 items-center">
               <div className="w-2 h-2 rounded-full bg-gray-400 shadow-inner"></div>
               <div className="w-2 h-2 rounded-full bg-gray-400 shadow-inner"></div>
            </div>

            {/* Main Panel */}
            <div className="mx-4 bg-[#e5e5e5] p-6 md:p-10">
               {/* Header */}
               <div className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-gray-300 rounded border border-gray-400 text-gray-600 shadow-sm">
                        <SignalIcon className="w-6 h-6" />
                     </div>
                     <div>
                        <h1 className="text-xl font-bold text-gray-700 tracking-widest uppercase font-mono">Signal Gen X-1</h1>
                        <p className="text-[10px] text-gray-500 font-mono">REFERENCE OSCILLATOR MODULE</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase font-mono">{isPlaying ? 'Output Active' : 'Offline'}</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Display */}
                  <div className="space-y-4">
                     <div className="bg-[#f8fafc] rounded-lg border-2 border-gray-300 p-4 relative shadow-inner">
                           <div className="text-slate-800 font-mono text-5xl font-black tracking-tighter text-right">
                              {pitch}<span className="text-xl text-gray-400 ml-2">Hz</span>
                           </div>
                           <div className="absolute top-2 left-3 text-[8px] text-gray-400 font-bold uppercase tracking-wider">Frequency</div>
                     </div>

                     <div className="bg-white rounded-lg border-2 border-gray-300 h-48 relative overflow-hidden shadow-inner">
                        <canvas ref={canvasRef} width={400} height={192} className="w-full h-full" />
                        <div className="absolute bottom-2 right-2 text-[8px] font-mono text-gray-400">OSC_VIEW_01</div>
                     </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex flex-col justify-between space-y-6">
                     <div className="bg-gray-100 p-5 rounded-lg border border-gray-300 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-4 block justify-between">
                              <span>Fine Tune</span>
                              <span className="text-indigo-600 font-mono">{pitch} Hz</span>
                        </label>
                        <div className="relative h-8 mb-4">
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
                              className="absolute top-1/2 w-6 h-6 bg-white rounded border-2 border-gray-400 shadow transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
                              style={{ left: `${((pitch - 430) / 20) * 100}%` }}
                           ></div>
                        </div>
                        <div className="flex justify-between items-center">
                              <button onClick={() => updatePitch(pitch - 1)} className="w-10 h-10 rounded bg-white text-gray-500 hover:border-indigo-400 hover:text-indigo-600 font-bold border border-gray-300 shadow-sm">-</button>
                              <button onClick={() => updatePitch(440)} className="px-4 h-8 rounded bg-gray-200 text-gray-500 hover:text-indigo-600 font-bold text-[10px] uppercase border border-gray-300">Reset Standard</button>
                              <button onClick={() => updatePitch(pitch + 1)} className="w-10 h-10 rounded bg-white text-gray-500 hover:border-indigo-400 hover:text-indigo-600 font-bold border border-gray-300 shadow-sm">+</button>
                        </div>
                     </div>

                     <div className="bg-gray-100 p-5 rounded-lg border border-gray-300 shadow-sm">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3">Waveform Shape</label>
                        <div className="grid grid-cols-4 gap-2">
                              {['sine', 'square', 'sawtooth', 'triangle'].map((w) => (
                                 <button 
                                    key={w}
                                    onClick={() => setWaveform(w as OscillatorType)}
                                    className={`h-12 rounded flex items-center justify-center border transition-all active:scale-95 ${
                                       waveform === w 
                                       ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm' 
                                       : 'bg-gray-200 border-gray-300 text-gray-400 hover:bg-white'
                                    }`}
                                    title={w}
                                 >
                                    {/* SVG Icons */}
                                    {w === 'sine' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c5.5-10 8-10 10 0s4.5 10 10 0" /></svg>}
                                    {w === 'square' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h5V7h6v10h6v-5" /></svg>}
                                    {w === 'sawtooth' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17L12 7v10l8-10" /></svg>}
                                    {w === 'triangle' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17L12 7l9 10" /></svg>}
                                 </button>
                              ))}
                        </div>
                     </div>

                     <button 
                        onClick={toggleTone}
                        className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-3 active:translate-y-0.5 ${
                              isPlaying 
                              ? 'bg-red-600 hover:bg-red-500 text-white' 
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                     >
                        <Cog6ToothIcon className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} />
                        {isPlaying ? 'Cut Signal' : 'Generate Signal'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
         <div className="mt-8">
            <Link to={NAVIGATION_PATHS['Instrument Tuner']} className="text-gray-400 font-bold text-xs hover:text-indigo-600 flex items-center justify-center gap-2 uppercase tracking-wider transition-colors">
               <ArrowPathIcon className="w-4 h-4" /> Return to Tuner Interface
            </Link>
         </div>
      </div>
   );
};

// --- ACHIEVEMENTS ---
export const Achievements: React.FC = () => (
   <div className="max-w-5xl mx-auto p-8">
      <div className="mb-10 flex items-center justify-between border-b border-gray-200 pb-6">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Badges & Milestones</h1>
            <p className="text-gray-500 text-sm mt-1 font-mono">USER_PROGRESS: 15% COMPLETE</p>
         </div>
         <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded border border-yellow-100">
             <TrophyIcon className="w-5 h-5 text-yellow-600" />
             <span className="text-yellow-800 font-bold">Rank: NOVICE</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
            { title: 'Initiate', desc: 'Logged first session', unlocked: true, icon: SignalIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { title: 'Consistency', desc: '7 day streak active', unlocked: true, icon: ArrowPathIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { title: 'Composer', desc: 'Wrote 5 songs with AI', unlocked: false, icon: MusicalNoteIcon, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
            { title: 'Metronome', desc: '1 hour rhythm practice', unlocked: false, icon: CpuChipIcon, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
            { title: 'Analyst', desc: 'Analyzed 10 songs', unlocked: false, icon: BookOpenIcon, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
            { title: 'Virtuoso', desc: '100 practice hours', unlocked: false, icon: TrophyIcon, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
         ].map((a, i) => (
            <div key={i} className={`p-6 rounded-xl border ${a.unlocked ? `${a.bg} ${a.border}` : 'bg-gray-50 border-gray-100'} relative overflow-hidden group`}>
               <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${a.unlocked ? 'border-white/50' : 'border-gray-200'} bg-white`}>
                     <a.icon className={`w-6 h-6 ${a.color}`} />
                  </div>
                  {a.unlocked ? <LockOpenIcon className="w-4 h-4 text-gray-400" /> : <LockClosedIcon className="w-4 h-4 text-gray-300" />}
               </div>
               <h3 className={`font-bold text-lg ${a.unlocked ? 'text-gray-900' : 'text-gray-400'}`}>{a.title}</h3>
               <p className="text-xs text-gray-500 mt-1 font-mono">{a.desc}</p>
            </div>
         ))}
      </div>
   </div>
);

// --- EXPORT ---
export const DataExport: React.FC = () => (
   <div className="max-w-xl mx-auto p-8 mt-10">
      <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
         
         <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-sm relative group">
             <ServerIcon className="w-10 h-10 text-indigo-500 relative z-10" />
         </div>
         
         <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Exfiltration</h1>
         <p className="text-gray-500 mb-8 text-sm font-mono">DOWNLOAD ARCHIVES OF YOUR STUDIO SESSIONS.</p>
         
         <div className="space-y-3">
             <button className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-4 rounded font-bold flex items-center justify-center gap-3 transition-all group">
                <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                DOWNLOAD_JSON_PACKET
             </button>
             <button className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 py-4 rounded font-bold flex items-center justify-center gap-3 transition-all">
                <ArrowDownTrayIcon className="w-5 h-5" />
                DOWNLOAD_CSV_REPORT
             </button>
         </div>
      </div>
   </div>
);

// --- SHORTCUTS ---
export const Shortcuts: React.FC = () => (
   <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
         <CommandLineIcon className="w-8 h-8 text-indigo-600" />
         <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Command Matrix</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
         <div className="grid grid-cols-2 bg-gray-50 p-4 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest">
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
            <div key={i} className="flex items-center justify-between p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
               <div className="text-gray-700 font-medium flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-indigo-500 transition-colors"></div>
                  {s.action}
               </div>
               <div className="flex items-center gap-1">
                  <KeyIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <kbd className="bg-gray-100 border border-gray-200 rounded px-3 py-1.5 text-xs font-mono font-bold text-gray-600 shadow-sm min-w-12 text-center">
                     {s.key}
                  </kbd>
               </div>
            </div>
         ))}
      </div>
   </div>
);