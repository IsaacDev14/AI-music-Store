import React, { useState } from 'react';
import { generateLyrics } from '../../api/apiService';
import { PencilSquareIcon, SparklesIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const Songwriter: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [mood, setMood] = useState('Happy');
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    const result = await generateLyrics(topic, genre, mood);
    setLyrics(result);
    setLoading(false);
  };

  return (
    <div className="h-full w-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Left Control Panel */}
      <div className="w-full md:w-96 bg-white border-r border-gray-200 p-6 flex flex-col overflow-y-auto z-10 shadow-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PencilSquareIcon className="w-6 h-6 text-purple-600" />
            Songwriter
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Describe your song idea and let AI draft the lyrics and structure for you.
          </p>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Genre / Style</label>
            <select 
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-lg border-gray-300 border p-3 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
            >
              <option>Pop</option>
              <option>Rock</option>
              <option>Hip Hop / Rap</option>
              <option>Country</option>
              <option>R&B</option>
              <option>Indie Folk</option>
              <option>Metal</option>
              <option>Jazz Standard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mood</label>
            <input 
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g. Heartbroken"
              className="w-full rounded-lg border-gray-300 border p-3 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Song Topic / Theme</label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is the song about? Tell a story..."
              className="w-full rounded-lg border-gray-300 border p-3 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 min-h-[120px]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
               <>
                 <ArrowPathIcon className="w-5 h-5 animate-spin" />
                 Writing...
               </>
            ) : (
               <>
                 <SparklesIcon className="w-5 h-5" />
                 Generate Lyrics
               </>
            )}
          </button>
        </div>
      </div>

      {/* Right Editor Area */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto bg-gray-100/50">
        <div className="max-w-3xl mx-auto bg-white min-h-[800px] shadow-lg rounded-sm p-10 md:p-16 relative border border-gray-200">
            {/* Notebook styling elements */}
            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-b from-gray-100 to-transparent opacity-50"></div>
            <div className="absolute top-0 left-10 bottom-0 w-px bg-red-100 hidden md:block"></div>

            {lyrics ? (
                <div className="prose prose-lg max-w-none font-serif text-gray-800 whitespace-pre-wrap leading-loose pl-0 md:pl-8">
                    <textarea 
                        className="w-full h-full min-h-[700px] outline-none resize-none bg-transparent placeholder-gray-300 text-gray-800"
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                    />
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 select-none">
                    <DocumentTextIcon className="w-24 h-24 mb-4 opacity-20" />
                    <h3 className="text-xl font-medium text-gray-400">Lyric Sheet</h3>
                    <p className="text-sm max-w-xs text-center mt-2 text-gray-400">
                        Your generated lyrics will appear here. You can edit them freely after generation.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Songwriter;