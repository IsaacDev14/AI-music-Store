import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, HandRaisedIcon, SpeakerWaveIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';

const Metronome: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  // Tap Tempo State
  const lastTapRef = useRef<number>(0);
  
  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0.0);
  const timerIDRef = useRef<number | null>(null);
  const lookahead = 25.0; 
  const scheduleAheadTime = 0.1;

  // Animation Ref for visual sync
  const visualQueueRef = useRef<{ note: number; time: number }[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    return () => {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
    setCurrentBeat((prev) => (prev + 1) % beatsPerMeasure);
  };

  const scheduleNote = (beatNumber: number, time: number) => {
    // Push to visual queue
    visualQueueRef.current.push({ note: beatNumber, time: time });

    // Audio Synthesis
    const osc = audioContextRef.current!.createOscillator();
    const envelope = audioContextRef.current!.createGain();

    // Drum-like synthesis
    if (beatNumber === 0) {
       // Kick / Downbeat
       osc.frequency.setValueAtTime(150, time);
       osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
       envelope.gain.setValueAtTime(volume, time);
       envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    } else {
       // Hi-Hat / Click
       osc.frequency.setValueAtTime(800, time); // Higher pitch
       osc.frequency.exponentialRampToValueAtTime(1200, time + 0.05); // Slight pitch snap
       envelope.gain.setValueAtTime(volume * 0.6, time); // Lower volume
       envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // Very short decay
    }

    osc.connect(envelope);
    envelope.connect(audioContextRef.current!.destination);

    osc.start(time);
    osc.stop(time + 0.5);
  };

  const scheduler = () => {
    if (!audioContextRef.current) return;
    
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentBeat, nextNoteTimeRef.current);
      nextNote();
    }
    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  };

  // Visual Loop
  const draw = () => {
      const ctx = audioContextRef.current;
      if (ctx) {
          const currentTime = ctx.currentTime;
          
          // Check queue for beats that should happen right now
          while (visualQueueRef.current.length && visualQueueRef.current[0].time < currentTime + 0.05) {
             const beat = visualQueueRef.current.shift();
             // Force React update for visual beat
             if (beat) {
                 // We use a slight delay in state update to match audio perfectly if needed, 
                 // but here we just trust the loop.
                 // However, we can't set state in a tight loop without potential jitter.
                 // Instead we rely on the CSS animation triggering via a key key.
                 document.getElementById(`beat-led-${beat.note}`)?.classList.add('active-beat');
                 setTimeout(() => {
                    document.getElementById(`beat-led-${beat.note}`)?.classList.remove('active-beat');
                 }, 100);
                 
                 // Trigger main speaker pulse
                 const speaker = document.getElementById('main-speaker');
                 if(speaker) {
                     speaker.style.transform = 'scale(1.1)';
                     setTimeout(() => speaker.style.transform = 'scale(1)', 100);
                 }
             }
          }
      }
      animationFrameRef.current = requestAnimationFrame(draw);
  }

  const togglePlay = () => {
    if (isPlaying) {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setIsPlaying(false);
    } else {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setCurrentBeat(0);
      nextNoteTimeRef.current = audioContextRef.current!.currentTime + 0.05;
      visualQueueRef.current = [];
      scheduler();
      draw();
      setIsPlaying(true);
    }
  };

  const handleTapTempo = () => {
      const now = Date.now();
      const diff = now - lastTapRef.current;
      lastTapRef.current = now;

      if (diff > 200 && diff < 3000) {
          const newBpm = Math.round(60000 / diff);
          setBpm(Math.max(30, Math.min(300, newBpm)));
      }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen w-full bg-stone-900 flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* Floor Texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        {/* --- THE RHYTHM MACHINE --- */}
        <div className="relative bg-stone-800 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] border-b-8 border-stone-950 w-full max-w-2xl overflow-hidden">
            
            {/* Wood Side Panels */}
            <div className="absolute top-0 bottom-0 left-0 w-4 md:w-6 bg-linear-to-r from-[#5c3a21] to-[#3e2716] border-r border-black opacity-90"></div>
            <div className="absolute top-0 bottom-0 right-0 w-4 md:w-6 bg-linear-to-l from-[#5c3a21] to-[#3e2716] border-l border-black opacity-90"></div>

            {/* Top Metal Faceplate */}
            <div className="mx-4 md:mx-6 bg-linear-to-b from-stone-700 to-stone-800 p-4 md:p-8 border-b border-black relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
                    
                    {/* Left: Display & Speaker */}
                    <div className="flex items-center gap-4 md:gap-6">
                         {/* Speaker Cone */}
                        <div className="relative w-24 h-24 md:w-32 md:h-32 bg-black rounded-full border-4 border-stone-600 shadow-[inset_0_0_20px_rgba(0,0,0,1)] flex items-center justify-center">
                             {/* Mesh */}
                             <div className="absolute inset-0 rounded-full opacity-40" 
                                  style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                             
                             {/* Active Cone */}
                             <div id="main-speaker" className="w-16 h-16 md:w-24 md:h-24 bg-linear-to-br from-stone-800 to-black rounded-full shadow-[inset_0_2px_5px_rgba(255,255,255,0.1)] transition-transform duration-75 ease-out flex items-center justify-center">
                                 <div className="w-6 h-6 md:w-8 md:h-8 bg-stone-900 rounded-full shadow-lg"></div>
                             </div>
                             
                             {/* Branding */}
                             <div className="absolute bottom-1 md:bottom-2 text-[6px] md:text-[8px] text-stone-500 font-bold tracking-widest">MONO</div>
                        </div>

                        {/* Digital Display */}
                        <div className="bg-black p-3 md:p-4 rounded-lg border-2 border-stone-600 shadow-inner min-w-[120px] md:min-w-[140px]">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[7px] md:text-[8px] text-red-500/70 uppercase font-mono tracking-widest">Tempo (BPM)</span>
                                {isPlaying && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"></div>}
                            </div>
                            <div className="text-3xl md:text-5xl font-mono text-red-500 font-bold tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] text-right">
                                {bpm.toString().padStart(3, '0')}
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-col items-center md:items-end gap-3 md:gap-4 w-full md:w-auto">
                        {/* Transport Controls */}
                        <div className="flex items-center gap-3 md:gap-4 bg-stone-900/50 p-2 rounded-xl border border-stone-600/50">
                            <button 
                                onClick={handleTapTempo}
                                className="w-12 h-10 md:w-16 md:h-12 bg-stone-300 rounded hover:bg-white active:bg-stone-400 border-b-4 border-stone-400 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center group"
                            >
                                <HandRaisedIcon className="w-4 h-4 md:w-5 md:h-5 text-stone-600 group-hover:text-stone-800" />
                                <span className="text-[7px] md:text-[8px] font-bold text-stone-500 uppercase">Tap</span>
                            </button>
                            <button 
                                onClick={togglePlay}
                                className={`w-16 h-14 md:w-20 md:h-16 rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg ${
                                    isPlaying 
                                    ? 'bg-red-600 border-red-800 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                                    : 'bg-stone-200 border-stone-400 text-stone-600 hover:bg-white'
                                }`}
                            >
                                {isPlaying ? <PauseIcon className="w-6 h-6 md:w-8 md:h-8" /> : <PlayIcon className="w-6 h-6 md:w-8 md:h-8" />}
                            </button>
                        </div>

                        {/* Volume Knob (Visual) */}
                        <div className="flex items-center gap-2 md:gap-3 bg-stone-900/30 px-2 md:px-3 py-1 rounded-full border border-stone-700">
                             <SpeakerWaveIcon className="w-3 h-3 md:w-4 md:h-4 text-stone-500" />
                             <input 
                                type="range" 
                                min="0" max="1" step="0.1"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-20 md:w-24 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-400"
                             />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Control Surface */}
            <div className="mx-4 md:mx-6 bg-[#2a2a2a] p-4 md:p-8 pb-8 md:pb-12 relative">
                {/* Screw Heads */}
                <div className="absolute top-1 md:top-2 left-1 md:left-2 w-2 h-2 md:w-3 md:h-3 bg-stone-500 rounded-full flex items-center justify-center"><div className="w-2 h-0.5 md:w-3 md:h-0.5 bg-stone-800 rotate-45"></div></div>
                <div className="absolute top-1 md:top-2 right-1 md:right-2 w-2 h-2 md:w-3 md:h-3 bg-stone-500 rounded-full flex items-center justify-center"><div className="w-2 h-0.5 md:w-3 md:h-0.5 bg-stone-800 rotate-45"></div></div>

                <div className="grid grid-cols-1 gap-4 md:gap-8">
                    
                    {/* BEAT GRID (Sequencer Look) */}
                    <div className="bg-black rounded-xl border border-stone-700 p-3 md:p-4 shadow-inner overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[8px] md:text-[9px] text-stone-400 uppercase font-bold tracking-widest">Sequencer / Measure</span>
                            <select 
                                value={beatsPerMeasure} 
                                onChange={(e) => setBeatsPerMeasure(parseInt(e.target.value))}
                                className="bg-stone-800 text-stone-300 text-xs border-none rounded py-0.5 px-2 focus:ring-0 cursor-pointer font-mono"
                            >
                                <option value="3">3/4</option>
                                <option value="4">4/4</option>
                                <option value="5">5/4</option>
                                <option value="6">6/8</option>
                            </select>
                        </div>
                        
                        <div className="flex justify-between gap-1 md:gap-2 h-12 md:h-16 items-center px-1 md:px-2">
                             {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                                 <div key={i} className="flex-1 flex flex-col items-center gap-1 md:gap-2 group">
                                     {/* LED */}
                                     <div 
                                        id={`beat-led-${i}`}
                                        className={`w-full h-2 md:h-3 rounded-sm transition-all duration-75 ${
                                            // Default State vs Active logic handled by JS class injection in 'draw'
                                            // Base style:
                                            i === 0 ? 'bg-amber-900' : 'bg-red-900'
                                        } shadow-inner`}
                                     >
                                        <style>{`
                                            .active-beat {
                                                background-color: ${i === 0 ? '#fbbf24' : '#ef4444'} !important;
                                                box-shadow: 0 0 15px ${i === 0 ? '#fbbf24' : '#ef4444'} !important;
                                                transform: scale(1.05);
                                            }
                                        `}</style>
                                     </div>
                                     
                                     {/* Pad Button (Visual) */}
                                     <div className={`w-full h-8 md:h-12 rounded bg-linear-to-b from-stone-600 to-stone-700 border-t border-stone-500 shadow-lg flex items-center justify-center text-[9px] md:text-[10px] font-bold text-stone-900 ${i===0 ? 'bg-stone-500' : ''}`}>
                                         {i + 1}
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* BPM SLIDER */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[8px] md:text-[9px] text-stone-500 font-bold uppercase tracking-widest">
                             <span>Largo (40)</span>
                             <span>Andante (100)</span>
                             <span>Presto (200)</span>
                        </div>
                        <div className="relative h-10 md:h-12 bg-black rounded-lg border border-stone-700 shadow-inner flex items-center px-3 md:px-4">
                             {/* Track Line */}
                             <div className="absolute left-3 md:left-4 right-3 md:right-4 h-1 bg-stone-800 rounded-full"></div>
                             <div className="absolute left-3 md:left-4 right-3 md:right-4 h-0.5 bg-red-900/30"></div>
                             
                             {/* Real Input */}
                             <input 
                                type="range" 
                                min="30" 
                                max="250" 
                                value={bpm}
                                onChange={(e) => setBpm(parseInt(e.target.value))}
                                className="w-full absolute inset-0 opacity-0 cursor-ew-resize z-20"
                             />
                             
                             {/* Custom Thumb */}
                             <div 
                                className="absolute w-12 h-6 md:w-16 md:h-8 bg-linear-to-b from-stone-300 to-stone-500 rounded shadow-lg border-t border-white flex flex-col items-center justify-center z-10 pointer-events-none transition-all duration-75"
                                style={{ left: `calc(${((bpm - 30) / 220) * 100}% - ${window.innerWidth < 768 ? '1.5rem' : '2rem'})` }}
                             >
                                 <div className="w-full h-px bg-stone-400 mb-0.5"></div>
                                 <div className="w-full h-px bg-stone-400 mb-0.5"></div>
                                 <div className="w-6 md:w-8 h-0.5 md:h-1 bg-red-500 rounded-full mt-0.5 md:mt-1 shadow-[0_0_5px_red]"></div>
                             </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Badge */}
            <div className="bg-[#202020] p-2 flex justify-center border-t border-black">
                 <div className="flex items-center gap-1 md:gap-2 text-stone-600">
                     <MusicalNoteIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                     <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em]">Rhythm Master 8000</span>
                 </div>
            </div>
        </div>

    </div>
  );
};

export default Metronome;