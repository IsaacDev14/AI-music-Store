/* eslint-disable */

// src/pages/Compose/ChordStudio.tsx
import React, { useState, useMemo, useRef } from 'react';
import { aiApi, type FullDisplayData } from '../../api/apiService';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  BookOpenIcon, 
  AdjustmentsHorizontalIcon,
  PlayCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

// --- CHORD VISUALIZER HELPERS ---
type Instrument = 'Guitar' | 'Ukulele';

const CHORD_SHAPES: Record<string, Record<string, number[]>> = {
  Guitar: {
    // [E, A, D, G, B, e] - -1 for mute, 0 for open
    'C': [-1, 3, 2, 0, 1, 0],
    'A': [-1, 0, 2, 2, 2, 0],
    'G': [3, 2, 0, 0, 0, 3],
    'E': [0, 2, 2, 1, 0, 0],
    'D': [-1, -1, 0, 2, 3, 2],
    'Em': [0, 2, 2, 0, 0, 0],
    'Am': [-1, 0, 2, 2, 1, 0],
    'Dm': [-1, -1, 0, 2, 3, 1],
    'F': [1, 3, 3, 2, 1, 1],
    'Bm': [-1, 2, 4, 4, 3, 2],
    'Bb': [-1, 1, 3, 3, 3, 1],
    'Cm': [-1, 3, 5, 5, 4, 3],
    'Gm': [3, 5, 5, 3, 3, 3],
    'Fm': [1, 3, 3, 1, 1, 1],
  },
  Ukulele: {
    // [G, C, E, A]
    'C': [0, 0, 0, 3],
    'G': [0, 2, 3, 2],
    'Am': [2, 0, 0, 0],
    'F': [2, 0, 1, 0],
    'Em': [0, 4, 3, 2],
    'Dm': [2, 2, 1, 0],
    'D': [2, 2, 2, 0],
    'A': [2, 1, 0, 0],
    'E': [4, 4, 4, 2], // var
    'Bm': [4, 2, 2, 2],
  }
};

const ChordBox: React.FC<{ chord: string; instrument: Instrument }> = ({ chord, instrument }) => {
  // Normalize chord name to basic triad/minor for lookup
  const root = chord.match(/^[A-G][#b]?m?/)?.[0] || chord;
  
  // Try exact match, then fallbacks
  let shape = CHORD_SHAPES[instrument][root];
  if (!shape) {
     // Try stripping '7', 'maj', etc if base triad exists
     const base = root.replace(/maj|dim|aug|sus|7|9|11|13/g, '');
     shape = CHORD_SHAPES[instrument][base];
  }

  const numStrings = instrument === 'Guitar' ? 6 : 4;
  const width = 80;
  const height = 100;
  const stringSpacing = width / (numStrings - 1);
  const fretSpacing = height / 5;

  if (!shape) {
    return (
      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm min-w-[100px] h-[140px]">
        <span className="font-bold text-gray-900 mb-2 text-sm">{chord}</span>
        <span className="text-[10px] text-gray-400">No Diagram</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 min-w-[120px]">
      <span className="font-bold text-base text-gray-900 mb-2">{chord}</span>
      <svg width={width + 10} height={height + 10} viewBox={`-5 -5 ${width + 10} ${height + 10}`} className="bg-white overflow-visible">
        {/* Nut */}
        <line x1="0" y1="0" x2={width} y2="0" stroke="#1f2937" strokeWidth="3" />
        
        {/* Frets */}
        {[1, 2, 3, 4, 5].map(i => (
           <line key={`f-${i}`} x1="0" y1={i * fretSpacing} x2={width} y2={i * fretSpacing} stroke="#e5e7eb" strokeWidth="2" />
        ))}
        
        {/* Strings */}
        {Array.from({ length: numStrings }).map((_, i) => (
           <line key={`s-${i}`} x1={i * stringSpacing} y1="0" x2={i * stringSpacing} y2={height} stroke="#374151" strokeWidth="1" />
        ))}
        
        {/* Dots & Markers */}
        {shape.map((fret, stringIdx) => {
           const cx = stringIdx * stringSpacing;
           if (fret === -1) {
              return <text key={stringIdx} x={cx} y="-6" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444">×</text>;
           }
           if (fret === 0) {
              return <circle key={stringIdx} cx={cx} cy="-6" r="2.5" stroke="#374151" strokeWidth="1" fill="none" />;
           }
           return (
              <circle 
                key={stringIdx} 
                cx={cx} 
                cy={(fret * fretSpacing) - (fretSpacing / 2)} 
                r="5.5" 
                fill="#2563eb" 
              />
           );
        })}
      </svg>
    </div>
  );
};

// Audio Synthesis Logic
const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13, 
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30, 
  'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
};

const playChord = (ctx: AudioContext, chordName: string, time: number, duration: number) => {
  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return;
  
  const root = match[1];
  const quality = match[2];
  const rootFreq = NOTE_FREQUENCIES[root] || 261.63;
  
  let intervals = [0, 4, 7]; 
  
  if (quality.includes('m') && !quality.includes('maj')) intervals = [0, 3, 7];
  if (quality.includes('dim')) intervals = [0, 3, 6];
  if (quality.includes('7')) {
    if (quality.includes('maj')) intervals.push(11);
    else intervals.push(10);
  }

  intervals.forEach((semitone, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = i === 0 ? 'triangle' : 'sine'; 
    const freq = rootFreq * Math.pow(2, semitone/12);
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
  });
};

// Helper function to format chord sheets with proper alignment
const formatChordSheet = (songData: FullDisplayData): string => {
  let formattedResult = '';
  
  // Header information
  formattedResult += `${songData.songTitle}\n`;
  if (songData.artist) {
    formattedResult += `Artist: ${songData.artist}\n`;
  }
  formattedResult += `Tuning: ${songData.tuning}\n`;
  formattedResult += `Key: ${songData.key}\n`;
  formattedResult += `${songData.capo || 'Capo: no capo'}\n\n`;

  // Use tablature if available, otherwise create from progression
  if (songData.tablature && songData.tablature.length > 0) {
    songData.tablature.forEach((section: { section: string; lines: Array<{ lyrics: string; isChordLine: boolean }> }) => {
      formattedResult += `[${section.section}]\n\n`;
      
      section.lines.forEach((line: { lyrics: string; isChordLine: boolean }) => {
        if (line.isChordLine) {
          formattedResult += `${line.lyrics}\n`;
        } else {
          formattedResult += `${line.lyrics}\n\n`;
        }
      });
    });
  } else {
    // Fallback: Create basic structure from progression
    formattedResult += `[Intro]\n\n`;
    
    // Show first 4 chords as intro
    const introChords = songData.progression.slice(0, Math.min(4, songData.progression.length));
    formattedResult += introChords.map((chord: { chord: string }) => chord.chord).join(' ') + '\n\n';
    
    // Create verse section
    formattedResult += `[Verse]\n\n`;
    const verseChords = songData.progression.slice(4, Math.min(8, songData.progression.length));
    
    verseChords.forEach((chord: { chord: string }, index: number) => {
      const sampleLyrics = [
        "In the quiet of the morning light",
        "When the world is still and calm",
        "There's a melody that fills the air",
        "Like a gentle healing balm"
      ];
      
      formattedResult += `${chord.chord.padEnd(12, ' ')}\n`;
      formattedResult += `${sampleLyrics[index] || "Lyrics line here"}\n\n`;
    });
  }

  return formattedResult;
};

const ChordStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'compose'>('search');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('Guitar');
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(true);

  // Compose State
  const [mood, setMood] = useState('Melancholic');
  const [genre, setGenre] = useState('Lo-Fi Hip Hop');
  const [composeResult, setComposeResult] = useState<FullDisplayData | null>(null);
  const [loadingCompose, setLoadingCompose] = useState(false);

  // Search State
  const [songQuery, setSongQuery] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [songResult, setSongResult] = useState<FullDisplayData | null>(null);
  const [theoryAnalysis, setTheoryAnalysis] = useState<string>('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Extract Chords for visualization
  const extractedChords = useMemo(() => {
    const data = activeTab === 'search' ? songResult : composeResult;
    if (!data?.progression) return [];
    
    const chordRegex = /\b[A-G][#b]?(?:m|maj|dim|aug|sus|add)?(?:7|9|11|13|6)?(?:(?:\/)[A-G][#b]?)?\b/g;
    const allChords = data.progression.map((p: { chord: string }) => p.chord).join(' ');
    const found = allChords.match(chordRegex) || [];
    return [...new Set(found)];
  }, [songResult, composeResult, activeTab]);

  const handleCompose = async () => {
    setLoadingCompose(true);
    try {
      const result = await aiApi.generateSongArrangement({
        songQuery: `${mood} ${genre} progression`,
        simplify: true,
        helpPractice: true,
        showSubstitutions: true,
        instrument: 'Guitar'
      });
      setComposeResult(result);
    } catch (error) {
      console.error('Failed to generate progression:', error);
    } finally {
      setLoadingCompose(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songQuery) return;
    setLoadingSearch(true);
    setSongResult(null);
    setTheoryAnalysis('');
    try {
      const result = await aiApi.generateSongArrangement({
        songQuery: songQuery,
        artist: artistQuery || undefined,
        simplify: true,
        helpPractice: true,
        showSubstitutions: true,
        instrument: 'Guitar',
        includeLyrics: true
      });
      setSongResult(result);
    } catch (error) {
      console.error('Failed to search song:', error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAnalyze = async () => {
    if (!songResult) return;
    setAnalyzing(true);
    try {
      const chords = extractedChords;
      const chordCount = chords.length;
      const hasMinor = chords.some((chord: string) => chord.includes('m') && !chord.includes('maj'));
      const hasSeventh = chords.some((chord: string) => chord.includes('7'));
      const hasSuspended = chords.some((chord: string) => chord.includes('sus'));
      
      let analysis = `This song uses ${chordCount} unique chords: ${chords.join(', ')}. `;
      analysis += `The progression features ${hasMinor ? 'both major and minor chords' : 'mostly major chords'}`;
      analysis += hasSeventh ? ' with some seventh chords adding harmonic color. ' : '. ';
      analysis += hasSuspended ? 'Suspended chords create tension and release. ' : '';
      analysis += `The chord choices create a ${mood.toLowerCase()} feeling typical of ${genre} music.`;
      
      setTheoryAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze:', error);
      setTheoryAnalysis('Unable to analyze music theory at this time.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePlay = async () => {
    const data = activeTab === 'search' ? songResult : composeResult;
    if (isPlaying || !data?.progression) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    setIsPlaying(true);
    const now = ctx.currentTime;
    let currentTime = now;
    const beatDuration = 0.6;

    data.progression.forEach((chord: { chord: string; duration: number }) => {
      const duration = chord.duration * beatDuration;
      playChord(ctx, chord.chord, currentTime, duration);
      currentTime += duration;
    });

    const totalDuration = (currentTime - now) * 1000;
    setTimeout(() => setIsPlaying(false), totalDuration);
  };

  // Function to render chord sheet with proper formatting
  const renderChordSheet = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Check if line contains chords (has chord characters but might be mixed with lyrics)
      const hasChords = /[A-G][#b]?(m|maj|dim|sus|7|9|add|aug)?/.test(line);
      const isSectionHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
      const isMetadata = line.includes('Key:') || line.includes('Capo:') || line.includes('Artist:') || line.includes('Tuning:');
      
      let className = "font-mono text-sm md:text-base leading-relaxed ";
      
      if (isSectionHeader) {
        className += "font-bold text-gray-900 text-lg mt-6 mb-2 uppercase tracking-wide";
      } else if (isMetadata) {
        className += "text-gray-600 font-medium";
      } else if (hasChords && !line.trim().match(/[a-z]/)) {
        // Line with only chords (no lowercase letters)
        className += "text-blue-600 font-bold tracking-widest text-lg";
      } else if (hasChords) {
        // Line with chords and possibly lyrics
        className += "text-blue-600 font-bold";
      } else if (line.trim() === '') {
        // Empty line
        return <div key={i} className="h-4"></div>;
      } else {
        // Regular lyrics
        className += "text-gray-800";
      }
      
      return (
        <div key={i} className={className}>
          {line || '\u00A0'}
        </div>
      );
    });
  };

//   const currentData = activeTab === 'search' ? songResult : composeResult;

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      
      {/* HEADER - Fixed */}
      <header className="flex-none bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
               {activeTab === 'search' ? <MagnifyingGlassIcon className="w-5 h-5 text-indigo-600" /> : <SparklesIcon className="w-5 h-5 text-purple-600" />}
            </div>
            <div>
               <h1 className="text-lg font-bold text-gray-900">{activeTab === 'search' ? 'Song Library' : 'AI Composer'}</h1>
               <p className="text-xs text-gray-500 font-medium">Powered by AI</p>
            </div>
         </div>

         {/* Tab Switcher */}
         <div className="bg-gray-100 p-1 rounded-lg flex font-medium text-sm">
            <button 
               onClick={() => setActiveTab('search')}
               className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'search' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
               Find Chords
            </button>
            <button 
               onClick={() => setActiveTab('compose')}
               className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'compose' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
               Generate New
            </button>
         </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4">
         
         {/* --- SEARCH MODE --- */}
         {activeTab === 'search' && (
            <div className="max-w-4xl mx-auto space-y-6">
               {/* Search Bar */}
               <form onSubmit={handleSearch} className="bg-white p-2 rounded-xl shadow border border-gray-100 flex flex-col md:flex-row gap-2">
                  <input 
                     type="text" 
                     placeholder="Song Title..." 
                     value={songQuery}
                     onChange={e => setSongQuery(e.target.value)}
                     className="flex-1 p-3 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 font-medium"
                  />
                  <div className="w-px bg-gray-200 hidden md:block my-2"></div>
                  <input 
                     type="text" 
                     placeholder="Artist Name (optional)..." 
                     value={artistQuery}
                     onChange={e => setArtistQuery(e.target.value)}
                     className="flex-1 p-3 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 font-medium"
                  />
                  <button 
                     type="submit" 
                     disabled={loadingSearch}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold shadow transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                  >
                     {loadingSearch ? 'Searching...' : 'Search'}
                  </button>
               </form>

               {songResult ? (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                           <BookOpenIcon className="w-5 h-5" /> 
                           Chord Sheet: {songResult.songTitle}
                        </h2>
                        <div className="flex gap-2">
                           <button 
                              onClick={handlePlay}
                              disabled={isPlaying}
                              className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                           >
                              <PlayCircleIcon className="w-4 h-4" />
                              {isPlaying ? 'Playing...' : 'Play'}
                           </button>
                           {!theoryAnalysis && (
                              <button 
                                 onClick={handleAnalyze} 
                                 disabled={analyzing}
                                 className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                 {analyzing ? 'Analyzing...' : 'Analyze Theory'}
                              </button>
                           )}
                        </div>
                     </div>

                     {theoryAnalysis && (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-900">
                           <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-2">
                              <InformationCircleIcon className="w-4 h-4" /> Music Theory Analysis
                           </h3>
                           <p className="leading-relaxed text-sm">{theoryAnalysis}</p>
                        </div>
                     )}

                     <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative min-h-[400px] font-mono">
                        {/* Paper texture effect */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-b from-gray-100 to-transparent opacity-50"></div>
                        <div className="space-y-1">
                           {renderChordSheet(formatChordSheet(songResult))}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="text-center py-12 opacity-50">
                     <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                     <p className="text-gray-400 font-medium">Enter a song title to get chords & lyrics</p>
                  </div>
               )}
            </div>
         )}

         {/* --- COMPOSE MODE --- */}
         {activeTab === 'compose' && (
            <div className="max-w-4xl mx-auto space-y-6">
               
               {/* Controls */}
               <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <AdjustmentsHorizontalIcon className="w-5 h-5 text-purple-500" /> Progression Settings
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Musical Genre</label>
                        <input 
                           type="text" 
                           value={genre} 
                           onChange={e => setGenre(e.target.value)}
                           className="w-full p-3 bg-gray-50 border-gray-200 rounded-lg text-gray-900 font-bold focus:ring-purple-500 focus:border-purple-500"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Emotional Mood</label>
                        <input 
                           type="text" 
                           value={mood} 
                           onChange={e => setMood(e.target.value)}
                           className="w-full p-3 bg-gray-50 border-gray-200 rounded-lg text-gray-900 font-bold focus:ring-purple-500 focus:border-purple-500"
                        />
                     </div>
                  </div>
                  <button 
                     onClick={handleCompose}
                     disabled={loadingCompose}
                     className="w-full bg-linear-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-purple-200 hover:shadow-xl transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                     {loadingCompose ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                     {loadingCompose ? 'Composing...' : 'Generate Progression'}
                  </button>
               </div>

               {composeResult && (
                  <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Key Info Card */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
                           <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Key</div>
                           <div className="text-2xl font-black text-gray-900">{composeResult.key}</div>
                        </div>
                         {/* Tempo Info Card */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
                           <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Tempo</div>
                           <div className="text-2xl font-black text-gray-900">120 <span className="text-sm text-gray-400 font-normal">BPM</span></div>
                        </div>
                        {/* Play Button (Visual) */}
                        <button 
                          onClick={handlePlay}
                          disabled={isPlaying}
                          className="bg-gray-900 text-white rounded-lg shadow hover:bg-black transition-colors flex flex-col items-center justify-center p-4 group disabled:opacity-50"
                        >
                           <PlayCircleIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-sm font-bold">{isPlaying ? 'Playing...' : 'Play Preview'}</span>
                        </button>
                     </div>

                     {/* Chord Sheet Display */}
                     <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative min-h-[400px] font-mono">
                        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-b from-gray-100 to-transparent opacity-50"></div>
                        <div className="space-y-1">
                           {renderChordSheet(formatChordSheet(composeResult))}
                        </div>
                     </div>

                     {/* Substitutions */}
                     {composeResult.substitutions && composeResult.substitutions.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chord Substitutions</h3>
                           <div className="grid md:grid-cols-2 gap-3">
                              {composeResult.substitutions.map((sub: { originalChord: string; substitutedChord: string; theory: string }, index: number) => (
                                 <div key={index} className="p-3 bg-gray-50 rounded border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                       <span className="line-through text-gray-500 text-sm">{sub.originalChord}</span>
                                       <span className="text-gray-400">→</span>
                                       <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded text-sm">{sub.substitutedChord}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{sub.theory}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Practice Tips */}
                     {composeResult.practiceTips && composeResult.practiceTips.length > 0 && (
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
                           <h3 className="text-purple-900 font-bold mb-2">Practice Tips</h3>
                           <ul className="space-y-2">
                              {composeResult.practiceTips.map((tip: string, index: number) => (
                                 <li key={index} className="flex items-start gap-2 text-purple-800 text-sm">
                                    <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-xs mt-0.5">
                                       {index + 1}
                                    </span>
                                    <span>{tip}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                  </div>
               )}
            </div>
         )}
      </div>

      {/* BOTTOM VISUALIZER PANEL */}
      <div className={`bg-white border-t border-gray-200 shadow-lg z-40 transition-all duration-300 ease-in-out flex flex-col shrink-0 ${isVisualizerOpen ? 'h-56' : 'h-12'}`}>
         
         {/* Header Bar */}
         <div 
            className="h-12 px-4 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 border-b border-gray-200 transition-colors"
            onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
         >
            {/* Title */}
            <div className="flex items-center gap-2">
               <ChevronUpIcon className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isVisualizerOpen ? 'rotate-180' : ''}`} />
               <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Chord Visualizer</span>
               {extractedChords.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{extractedChords.length}</span>}
            </div>

            {/* Instrument Toggle */}
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
               <span className="text-[10px] font-bold text-gray-400 uppercase hidden sm:inline-block">Instrument:</span>
               <div className="flex bg-white border border-gray-200 p-0.5 rounded-md shadow-sm">
                  <button 
                     onClick={() => setSelectedInstrument('Guitar')}
                     className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${selectedInstrument === 'Guitar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                     Guitar
                  </button>
                  <button 
                     onClick={() => setSelectedInstrument('Ukulele')}
                     className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${selectedInstrument === 'Ukulele' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                     Ukulele
                  </button>
               </div>
            </div>
         </div>

         {/* Scrollable Content */}
         {isVisualizerOpen && (
             <div className="flex-1 overflow-x-auto p-4 flex items-center gap-4 bg-white">
                {extractedChords.length > 0 ? (
                    extractedChords.map((chord: string) => (
                       <div key={chord} className="shrink-0 transition-transform hover:-translate-y-1">
                          <ChordBox chord={chord} instrument={selectedInstrument} />
                       </div>
                    ))
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-gray-400">
                       <p className="text-sm font-medium">Select a song or generate a progression to see chords</p>
                    </div>
                )}
             </div>
         )}
      </div>

    </div>
  );
};

export default ChordStudio;