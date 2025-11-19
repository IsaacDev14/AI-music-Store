import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  TagIcon, 
  PlusIcon, 
  TrashIcon, 
  PlayCircleIcon, 
  MagnifyingGlassIcon,
  MicrophoneIcon,
  HashtagIcon,
  FunnelIcon,
  PauseCircleIcon
} from '@heroicons/react/24/solid';

interface JamSession {
  id: string;
  title: string;
  date: string;
  genre: string;
  musicalKey: string;
  tempo: number;
  mood: string;
  notes: string;
  duration: string; 
  likes: number;
}

const GENRES = ['Lo-Fi', 'Rock', 'Jazz', 'Hip Hop', 'Electronic', 'R&B', 'Classical', 'Metal', 'Pop'];
const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'Am', 'Em', 'Dm'];

const JamHistory: React.FC = () => {
  const [sessions, setSessions] = useState<JamSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Form State
  const [newSession, setNewSession] = useState<Partial<JamSession>>({
    title: '',
    genre: 'Lo-Fi',
    musicalKey: 'C',
    tempo: 90,
    mood: '',
    notes: '',
    duration: '30'
  });

  useEffect(() => {
    const saved = localStorage.getItem('jam_session_history');
    if (saved) {
      setSessions(JSON.parse(saved));
    } else {
      const seedData: JamSession[] = [
         { id: '1', title: 'Midnight Lo-Fi Sketch', date: new Date(Date.now() - 86400000 * 2).toISOString(), genre: 'Lo-Fi', musicalKey: 'Eb', tempo: 85, mood: 'Chill', notes: 'Used the chord generator for a jazzy progression. Needs a sax melody.', duration: '45', likes: 12 },
         { id: '2', title: 'Funky Bass Groove', date: new Date(Date.now() - 86400000 * 5).toISOString(), genre: 'Funk', musicalKey: 'G', tempo: 110, mood: 'Energetic', notes: 'Slap bass idea with syncopated drums.', duration: '20', likes: 5 },
      ];
      setSessions(seedData);
      localStorage.setItem('jam_session_history', JSON.stringify(seedData));
    }
  }, []);

  const handleSave = () => {
    if (!newSession.title) return;
    
    const session: JamSession = {
      id: Date.now().toString(),
      title: newSession.title,
      date: new Date().toISOString(),
      genre: newSession.genre || 'Pop',
      musicalKey: newSession.musicalKey || 'C',
      tempo: newSession.tempo || 120,
      mood: newSession.mood || 'Neutral',
      notes: newSession.notes || '',
      duration: newSession.duration || '30',
      likes: 0
    };

    const updated = [session, ...sessions];
    setSessions(updated);
    localStorage.setItem('jam_session_history', JSON.stringify(updated));
    
    setShowForm(false);
    setNewSession({
       title: '', genre: 'Lo-Fi', musicalKey: 'C', tempo: 90, mood: '', notes: '', duration: '30'
    });
  };

  const handleDelete = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('jam_session_history', JSON.stringify(updated));
  };

  const togglePlay = (id: string) => {
      if (playingId === id) setPlayingId(null);
      else setPlayingId(id);
  };

  const filteredSessions = sessions.filter(s => 
      s.title.toLowerCase().includes(filter.toLowerCase()) || 
      s.genre.toLowerCase().includes(filter.toLowerCase()) ||
      s.notes.toLowerCase().includes(filter.toLowerCase())
  );

  // Stats
  const totalHours = sessions.reduce((acc, s) => acc + parseInt(s.duration), 0) / 60;
  const favGenre = sessions.length > 0 
    ? sessions.sort((a,b) => sessions.filter(v => v.genre===a.genre).length - sessions.filter(v => v.genre===b.genre).length).pop()?.genre 
    : '-';

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      
      {/* HEADER STATS AREA - Fixed */}
      <div className="bg-indigo-50 border-b border-indigo-100 p-6 pb-16 relative overflow-hidden flex-none">
         <div className="w-full mx-auto relative z-10">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2 text-indigo-900">Studio Archives</h1>
                    <p className="text-indigo-600/80">Your creative history, ideas, and rough drafts.</p>
                </div>
                <button 
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform hover:-translate-y-1 flex-shrink-0"
                >
                    <PlusIcon className="w-5 h-5" /> New Session
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                    <div className="text-xs text-indigo-400 uppercase tracking-wider font-bold mb-1">Total Tracks</div>
                    <div className="text-2xl font-bold text-gray-800">{sessions.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                    <div className="text-xs text-indigo-400 uppercase tracking-wider font-bold mb-1">Studio Time</div>
                    <div className="text-2xl font-bold text-gray-800">{totalHours.toFixed(1)} <span className="text-sm font-normal text-gray-400">hrs</span></div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                    <div className="text-xs text-indigo-400 uppercase tracking-wider font-bold mb-1">Top Vibe</div>
                    <div className="text-2xl font-bold text-gray-800 truncate">{favGenre || '-'}</div>
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 shadow-lg flex items-center justify-between cursor-pointer hover:opacity-90 text-white">
                    <div className="min-w-0">
                       <div className="text-xs text-indigo-100 uppercase tracking-wider font-bold mb-1">Last Session</div>
                       <div className="text-sm font-bold truncate">{sessions[0]?.title || 'None'}</div>
                    </div>
                    <PlayCircleIcon className="w-8 h-8 text-white/80 flex-shrink-0" />
                </div>
            </div>
         </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="w-full mx-auto -mt-8 px-6 relative z-20 mb-6 flex-none">
          <div className="bg-white rounded-xl shadow-lg p-2 flex items-center gap-4 border border-gray-200">
              <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-lg border border-gray-100 min-w-0">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                  <input 
                      type="text" 
                      placeholder="Search by title, genre, or notes..." 
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      className="w-full py-3 bg-transparent border-none focus:ring-0 text-gray-700 font-medium placeholder-gray-400 min-w-0 outline-none"
                  />
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 border-l border-gray-100 flex-shrink-0">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-500">Filter</span>
              </div>
          </div>
      </div>

      {/* MAIN CONTENT GRID - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
         <div className="w-full mx-auto">
            
            {/* NEW ENTRY FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-gray-50 p-6 flex justify-between items-center border-b border-gray-200 sticky top-0">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <MicrophoneIcon className="w-5 h-5 text-indigo-600" /> Log New Jam
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Rainy Day Blues"
                                    value={newSession.title}
                                    onChange={e => setNewSession({...newSession, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Genre</label>
                                    <select 
                                        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={newSession.genre}
                                        onChange={e => setNewSession({...newSession, genre: e.target.value})}
                                    >
                                        {GENRES.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (m)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={newSession.duration}
                                        onChange={e => setNewSession({...newSession, duration: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Key</label>
                                    <select 
                                        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={newSession.musicalKey}
                                        onChange={e => setNewSession({...newSession, musicalKey: e.target.value})}
                                    >
                                        {KEYS.map(k => <option key={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BPM</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={newSession.tempo}
                                        onChange={e => setNewSession({...newSession, tempo: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mood</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Chill"
                                        value={newSession.mood}
                                        onChange={e => setNewSession({...newSession, mood: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                                <textarea 
                                    className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-900 h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="What instruments? Progression? Ideas?"
                                    value={newSession.notes}
                                    onChange={e => setNewSession({...newSession, notes: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={handleSave}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors"
                            >
                                Save to Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SESSIONS GRID */}
            {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 min-h-[200px]">
                    <MicrophoneIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-medium text-lg">No sessions found.</p>
                    <p className="text-sm">Start recording your creative journey.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                    {filteredSessions.map((session) => (
                        <div key={session.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col min-w-0">
                            
                            {/* Card Header / Cover */}
                            <div className="h-24 bg-gradient-to-r from-gray-50 to-white p-6 relative overflow-hidden transition-colors">
                                <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 transform rotate-12 translate-x-4 -translate-y-4 bg-indigo-600 rounded-full`}></div>
                                <div className="relative z-10 min-w-0">
                                    <span className="inline-block px-2 py-1 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm mb-2">
                                        {session.genre}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-800 truncate">{session.title}</h3>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col min-w-0">
                                {/* Metadata Grid */}
                                <div className="flex items-center gap-4 mb-6 text-xs font-bold text-gray-500 flex-wrap">
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex-shrink-0">
                                        <HashtagIcon className="w-3 h-3 text-indigo-500" /> {session.musicalKey}
                                    </div>
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex-shrink-0">
                                        <ClockIcon className="w-3 h-3 text-indigo-500" /> {session.tempo} BPM
                                    </div>
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex-shrink-0">
                                        <TagIcon className="w-3 h-3 text-indigo-500" /> {session.duration}m
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-1 leading-relaxed break-words min-w-0">
                                    {session.notes || <span className="italic text-gray-400">No notes added...</span>}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto min-w-0">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                                        <CalendarDaysIcon className="w-4 h-4" />
                                        {new Date(session.date).toLocaleDateString()}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => togglePlay(session.id)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${playingId === session.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {playingId === session.id ? <PauseCircleIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(session.id)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Visualizer Bar (Decoration) */}
                            {playingId === session.id && (
                                <div className="h-1 w-full bg-gray-100 flex items-end gap-0.5 px-4 pb-1 overflow-hidden">
                                    {Array.from({length: 40}).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 bg-indigo-500 animate-pulse" 
                                            style={{ 
                                                height: Math.random() * 100 + '%',
                                                animationDuration: Math.random() * 0.5 + 0.2 + 's' 
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default JamHistory;