/* eslint-disable */

// src/pages/Workflow/WorkflowBuilder.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  MusicalNoteIcon,
  BookOpenIcon,
  PlayIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  FireIcon,
  BoltIcon,
  AcademicCapIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { generateLesson } from '../../api/apiService'; // ← REAL AI

const WORKFLOW_STEPS = [
  { id: 'skill-level', label: 'Level', icon: ChartBarIcon },
  { id: 'instrument-focus', label: 'Instrument', icon: MusicalNoteIcon },
  { id: 'lesson-type', label: 'Focus', icon: BookOpenIcon },
  { id: 'generate', label: 'Generate', icon: PlayIcon },
];

const STEP_CONFIGS = {
  'skill-level': {
    title: 'Select Your Current Skill Level',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
      { value: 'expert', label: 'Expert' },
    ],
  },
  'instrument-focus': {
    title: 'What Instrument Do You Play?',
    options: [
      { value: 'guitar', label: 'Guitar', icon: MusicalNoteIcon },
      { value: 'piano', label: 'Piano', icon: BookOpenIcon },
      { value: 'violin', label: 'Violin', icon: ChartBarIcon },
      { value: 'drums', label: 'Drums', icon: BoltIcon },
      { value: 'bass', label: 'Bass Guitar', icon: FireIcon },
      { value: 'voice', label: 'Voice', icon: AcademicCapIcon },
      { value: 'saxophone', label: 'Saxophone', icon: CodeBracketIcon },
      { value: 'ukulele', label: 'Ukulele', icon: MusicalNoteIcon },
      { value: 'trumpet', label: 'Trumpet', icon: ChartBarIcon },
    ],
  },
};

const PRESET_FOCUS = [
  'Technique',
  'Music Theory',
  'Learn Songs',
  'Ear Training',
  'Improvisation',
  'Sight Reading',
  'Rhythm & Groove',
  'Speed & Accuracy',
  'Tone & Expression',
];

interface WorkflowData {
  'skill-level': string;
  'instrument-focus': string;
  'lesson-type': string;
  'custom-focus'?: string;
}

const WorkflowBuilder: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<WorkflowData>({
    'skill-level': '',
    'instrument-focus': '',
    'lesson-type': '',
    'custom-focus': '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<string>('');
  const [error, setError] = useState<string>('');

  const currentIdx = WORKFLOW_STEPS.findIndex(s => s.id === step);
  const current = WORKFLOW_STEPS[currentIdx];

  useEffect(() => {
    if (!step || currentIdx === -1) {
      navigate('/builder/skill-level', { replace: true });
    }
  }, [step, navigate, currentIdx]);

  const select = (key: keyof WorkflowData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
    if (currentIdx < 3) {
      setTimeout(() => navigate(`/builder/${WORKFLOW_STEPS[currentIdx + 1].id}`), 300);
    }
  };

  const generateRealLesson = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedLesson('');

    const focus = data['custom-focus'] || data['lesson-type'] || 'General Practice';

    try {
      const lesson = await generateLesson({
        skillLevel: data['skill-level'] || 'intermediate',
        instrument: data['instrument-focus'],
        focus,
      });
      setGeneratedLesson(lesson);
    } catch (err) {
      setError('Failed to generate lesson. Is your AI backend running on port 8000?');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFinalFocus = () => data['custom-focus'] || data['lesson-type'] || '—';
  const getLabel = (key: 'skill-level' | 'instrument-focus') => {
    const opt = STEP_CONFIGS[key]?.options.find(o => o.value === data[key]);
    return opt?.label || '—';
  };

  const resetAndStartOver = () => {
    setData({ 'skill-level': '', 'instrument-focus': '', 'lesson-type': '', 'custom-focus': '' });
    setGeneratedLesson('');
    setError('');
    navigate('/builder/skill-level');
  };

  if (!current) return null;
  const Icon = current.icon;

  // --- UI UPDATES START HERE ---
  const activeColor = 'text-indigo-600';
  const doneBg = 'bg-gradient-to-r from-indigo-500 to-purple-600';
  const activeBg = 'bg-indigo-50 ring-2 ring-indigo-500';

  return (
    <div className="min-h-screen w-screen bg-gray-50 flex flex-col font-sans">
      {/* HEADER - Updated for sleeker look */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-500 hover:text-indigo-600 transition duration-150 rounded-lg hover:bg-gray-100"
            aria-label="Go Back"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            AI Practice Workflow
          </h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          
          {/* PROGRESS BAR - Updated styling */}
          <div className="flex justify-center items-center gap-4 sm:gap-8 mb-16">
            {WORKFLOW_STEPS.map((s, i) => {
              const isDone = i < currentIdx || !!data[s.id as keyof WorkflowData] || (i === 2 && !!data['custom-focus'] && data['custom-focus'].length > 0);
              const isActive = i === currentIdx;
              const StepIcon = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => navigate(`/builder/${s.id}`)}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg transform ${isDone ? `${doneBg} text-white scale-105` : isActive ? `${activeBg} ${activeColor} shadow-indigo-200` : 'bg-gray-100 text-gray-500'}`}>
                      {isDone ? <CheckCircleIcon className="w-7 h-7" /> : <StepIcon className="w-7 h-7" />}
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold tracking-wide ${isDone ? 'text-indigo-600' : isActive ? activeColor : 'text-gray-500'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && <div className={`flex-1 h-1.5 mt-2 rounded-full hidden sm:block ${i < currentIdx ? doneBg : 'bg-gray-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* MAIN CONTENT CARD - Updated for high professionalism */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-12">
            {step === 'generate' ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-3xl w-full">

                  {/* Generating State */}
                  {isGenerating && (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full inline-flex items-center justify-center mb-10 animate-spin-slow">
                        <SparklesIcon className="w-12 h-12 text-indigo-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Building your **personalized lesson**...
                      </h2>
                      <p className="text-md text-gray-600 mb-8">
                        The AI is working hard, this typically takes 6–15 seconds.
                      </p>
                      <div className="flex justify-center gap-3">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-4 h-4 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 0.3}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isGenerating && (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-red-50 border-4 border-red-200 rounded-full inline-flex items-center justify-center mb-6 shadow-inner">
                        <ArrowPathIcon className="w-10 h-10 text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-800 mb-3">Generation Failed</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
                      <button
                        onClick={generateRealLesson}
                        className="px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition duration-150 shadow-md hover:shadow-lg"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Success: Show Lesson */}
                  {generatedLesson && !isGenerating && (
                    <div className="space-y-12 animate-fade-in">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-linear-to-br from-teal-400 to-emerald-500 rounded-full inline-flex items-center justify-center mb-6 shadow-xl ring-4 ring-white">
                          <SparklesIcon className="w-14 h-14 text-white" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
                          Lesson Generated!
                        </h2>
                        <p className="text-xl text-gray-600">
                          Time to start practicing.
                        </p>
                      </div>

                      {/* Lesson Content Box */}
                      <div className="bg-gray-50 rounded-2xl p-6 sm:p-10 border border-gray-200 shadow-inner">
                        <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-2 border-indigo-100">
                            Your Custom Lesson Plan
                        </h3>
                        <div className="prose prose-lg max-w-none">
                          {/* We use a code block for the lesson to preserve formatting and provide a 'developer' feel */}
                          <pre className="whitespace-pre-wrap font-mono text-gray-800 leading-relaxed text-sm sm:text-base bg-white p-4 rounded-lg border border-gray-200 shadow-md">
                            {generatedLesson}
                          </pre>
                        </div>
                      </div>

                      <div className="text-center pt-6">
                        <button
                          onClick={resetAndStartOver}
                          className="px-10 py-4 bg-linear-to-r from-indigo-600 to-purple-700 text-white text-lg font-bold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-indigo-500/50"
                        >
                          <ArrowPathIcon className="w-5 h-5 inline-block mr-2 align-text-bottom" />
                          Create Another Lesson
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Initial Generate Screen */}
                  {!isGenerating && !generatedLesson && !error && (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-linear-to-br from-teal-100 to-green-100 rounded-full inline-flex items-center justify-center mb-10 shadow-lg">
                        <SparklesIcon className="w-14 h-14 text-teal-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-10">
                        Review & Generate
                      </h2>

                      {/* Summary Card */}
                      <div className="bg-gray-50 rounded-2xl p-8 mb-12 text-left space-y-5 border border-gray-200 max-w-xl mx-auto shadow-inner">
                        <h3 className='text-xl font-bold text-gray-800 mb-4 border-b pb-2'>
                            Lesson Parameters
                        </h3>
                        <div className="flex justify-between text-lg border-b border-gray-100 pb-2">
                          <span className="text-gray-600 font-medium flex items-center">
                            <ChartBarIcon className='w-5 h-5 mr-2 text-indigo-500'/> Level
                          </span>
                          <span className="font-extrabold text-gray-900">{getLabel('skill-level')}</span>
                        </div>
                        <div className="flex justify-between text-lg border-b border-gray-100 pb-2">
                          <span className="text-gray-600 font-medium flex items-center">
                            <MusicalNoteIcon className='w-5 h-5 mr-2 text-indigo-500'/> Instrument
                          </span>
                          <span className="font-extrabold text-gray-900">{getLabel('instrument-focus')}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-600 font-medium flex items-center">
                            <BookOpenIcon className='w-5 h-5 mr-2 text-indigo-500'/> Focus
                          </span>
                          <span className="font-extrabold text-gray-900">{getFinalFocus()}</span>
                        </div>
                      </div>

                      <button
                        onClick={generateRealLesson}
                        className="px-16 py-5 bg-linear-to-r from-teal-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-teal-500/50"
                      >
                        <SparklesIcon className='w-6 h-6 inline-block mr-2 align-text-bottom' />
                        Generate My Lesson Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ALL OTHER STEPS — Enhanced UI with professional styling */
              <>
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-linear-to-br from-indigo-50 to-purple-50 rounded-2xl inline-flex items-center justify-center mb-6 shadow-xl ring-4 ring-white">
                    <Icon className="w-10 h-10 text-indigo-700" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {STEP_CONFIGS[step as keyof typeof STEP_CONFIGS]?.title || 'What do you want to work on?'}
                  </h2>
                </div>

                {step === 'lesson-type' ? (
                  <div className="space-y-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {PRESET_FOCUS.map(item => (
                        <button
                          key={item}
                          onClick={() => select('lesson-type', item)}
                          className={`py-5 px-4 rounded-xl border-2 text-md font-semibold transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg ${data['lesson-type'] === item && !data['custom-focus'] ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xl' : 'border-gray-200 hover:border-indigo-300 bg-white shadow-md'}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    <div className="text-center pt-4">
                      <div className="inline-flex items-center w-full max-w-2xl text-gray-500 mb-6">
                        <div className="h-px bg-gray-300 flex-1" />
                        <span className="text-sm font-medium mx-4">
                            OR DESCRIBE YOUR OWN FOCUS
                        </span>
                        <div className="h-px bg-gray-300 flex-1" />
                      </div>
                      <input
                        type="text"
                        value={data['custom-focus'] || ''}
                        onChange={e => setData(prev => ({ ...prev, 'custom-focus': e.target.value, 'lesson-type': '' }))}
                        placeholder="e.g. Wonderwall solo, blues licks in A, vocal runs, double kick patterns..."
                        className="w-full max-w-2xl px-6 py-4 text-lg rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-md"
                      />
                    </div>

                    {/* Conditional Continue Button for Focus Step */}
                    {(data['lesson-type'] || data['custom-focus']) && (
                      <div className="text-center pt-6">
                        <button
                          onClick={() => navigate('/builder/generate')}
                          className="px-12 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Continue <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {STEP_CONFIGS[step as keyof typeof STEP_CONFIGS].options.map(opt => {
                        // Dynamically use icon from config if available (currently only for instrument-focus)
                        const OptIcon = (STEP_CONFIGS[step as keyof typeof STEP_CONFIGS] as any).options.find((o: any) => o.value === opt.value)?.icon;
                        
                        return (
                        <button
                          key={opt.value}
                          onClick={() => select(step as any, opt.value)}
                          className={`flex flex-col items-center justify-center py-10 px-6 rounded-2xl border-2 text-xl font-bold transition-all duration-200 transform hover:-translate-y-1 shadow-lg ${data[step as keyof WorkflowData] === opt.value ? 'border-indigo-600 bg-linear-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-xl ring-2 ring-indigo-300' : 'border-gray-200 hover:border-indigo-300 bg-white shadow-md'}`}
                        >
                            {OptIcon && <OptIcon className='w-8 h-8 mb-3 text-indigo-500' />}
                            {opt.label}
                        </button>
                    )})}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkflowBuilder;