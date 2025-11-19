import React, { useState, useEffect } from 'react';
import { getPracticeAdvice } from '../../api/apiService';
import { ChartBarIcon, ClockIcon, TrophyIcon, FireIcon, PlusIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';

interface Session {
  id: string;
  date: string;
  duration: number;
  instrument: string;
  focus: string;
  notes: string;
}

const PracticeLog: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Form State
  const [newSession, setNewSession] = useState<Partial<Session>>({
    duration: 30,
    instrument: 'Guitar',
    focus: '',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('music_studio_logs');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  const saveSession = () => {
    const session: Session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: newSession.duration || 30,
      instrument: newSession.instrument || 'Guitar',
      focus: newSession.focus || 'General Practice',
      notes: newSession.notes || ''
    };
    
    const updated = [session, ...sessions];
    setSessions(updated);
    localStorage.setItem('music_studio_logs', JSON.stringify(updated));
    setShowForm(false);
    setNewSession({ duration: 30, instrument: 'Guitar', focus: '', notes: '' });
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getPracticeAdvice(sessions);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  // Stats
  const totalHours = (sessions.reduce((acc, s) => acc + s.duration, 0) / 60).toFixed(1);
  const sessionCount = sessions.length;

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 p-6 flex-none">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Practice Log</h1>
              <p className="text-gray-500">Track your journey and build consistency.</p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-200 flex items-center gap-2 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Log Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto w-full">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                <ClockIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-medium uppercase">Total Practice</div>
                <div className="text-3xl font-bold text-gray-900">{totalHours} <span className="text-sm font-normal text-gray-400">hrs</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-purple-50 rounded-full text-purple-600">
                <TrophyIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-medium uppercase">Sessions</div>
                <div className="text-3xl font-bold text-gray-900">{sessionCount}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-6 rounded-xl shadow-lg text-white flex items-center justify-between relative overflow-hidden">
               <div className="relative z-10">
                 <div className="text-white/80 font-medium text-sm uppercase">AI Coach</div>
                 <button 
                    onClick={handleGetAdvice}
                    disabled={loadingAdvice}
                    className="mt-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2"
                 >
                    {loadingAdvice ? 'Analyzing...' : 'Get Feedback'} 
                    {!loadingAdvice && <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />}
                 </button>
               </div>
               <FireIcon className="w-24 h-24 absolute -right-4 -bottom-4 text-white/20 rotate-12" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
            {/* History List - Scrollable */}
            <div className="lg:col-span-2 space-y-4 min-h-0">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Recent Sessions</h2>
              
              {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 mb-6 animate-fade-in-down">
                  <h3 className="text-base font-semibold mb-4">New Entry</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Instrument</label>
                      <select 
                        value={newSession.instrument} 
                        onChange={e => setNewSession({...newSession, instrument: e.target.value})}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option>Guitar</option>
                        <option>Piano</option>
                        <option>Bass</option>
                        <option>Drums</option>
                        <option>Vocals</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Duration (mins)</label>
                      <input 
                        type="number" 
                        value={newSession.duration}
                        onChange={e => setNewSession({...newSession, duration: parseInt(e.target.value)})}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Focus Area</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Scales, Song Rehearsal"
                        value={newSession.focus}
                        onChange={e => setNewSession({...newSession, focus: e.target.value})}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                      />
                  </div>
                  <div className="mb-4">
                     <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Notes</label>
                     <textarea 
                        value={newSession.notes}
                        onChange={e => setNewSession({...newSession, notes: e.target.value})}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        placeholder="What went well? What needs work?"
                     />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                    <button onClick={saveSession} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Save Log</button>
                  </div>
                </div>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {sessions.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300 text-gray-400">
                    <ChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No practice logs yet. Start today!</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                      <div className="flex-shrink-0 text-center bg-gray-100 rounded-lg p-3 min-w-[80px]">
                        <div className="text-xs font-bold text-gray-500 uppercase">{new Date(session.date).toLocaleDateString(undefined, { month: 'short' })}</div>
                        <div className="text-2xl font-bold text-gray-800">{new Date(session.date).getDate()}</div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="font-bold text-gray-900 truncate">{session.focus || 'Free Practice'}</h3>
                           <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex-shrink-0 ml-2">{session.instrument}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 break-words">{session.notes}</p>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm font-medium flex-shrink-0">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {session.duration}m
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Advice Column - Sticky */}
            <div className="lg:col-span-1">
               {advice && (
                 <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 sticky top-6">
                   <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
                     <FireIcon className="w-5 h-5" />
                     Coach Feedback
                   </h3>
                   <div className="prose prose-sm prose-yellow text-yellow-900">
                     <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed break-words">{advice}</pre>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeLog;