import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import InstrumentProvider from './context/InstrumentProvider';
import WorkflowBuilder from './pages/Workflow/WorkflowBuilder';

import { NAVIGATION_PATHS } from './utils/constants';

// Import other pages
import TunerPage from './pages/Tools/TunerPage';
import ChordStudio from './pages/Compose/ChordStudio';
import MelodyStudio from './pages/Compose/MelodyStudio';
import Metronome from './pages/Tools/Metronome';
import BackingTrack from './pages/Tools/BackingTrack';
import RhythmTrainer from './pages/Tools/RhythmTrainer';
import { TunerCalibration } from './pages/Tools/Tuner Calibration';
import Dashboard from './pages/Dashboard';
import MelodyGenerator from './pages/Tools/MelodyGenerator';
import ImprovAssistant from './pages/Tools/ImprovAssistant';
import Songwriter from './pages/Tools/SongWriter';
import JamHistory from './pages/Tools/JamHistory';
import PracticeLog from './pages/Tools/PracticeLog';
import { Achievements, DataExport, Shortcuts } from './pages/Tools/GenericPages';

export default function App() {
  return (
    <InstrumentProvider>
      <AppLayout>
        <Routes>
          {/* Default redirect to workflow */}
          <Route path="/" element={<Dashboard />} />

          {/* Workflow Builder with steps */}
          <Route path="/builder/:step" element={<WorkflowBuilder />} />
          <Route path="/builder" element={<Navigate to="/builder/skill-level" replace />} />

          {/* Tool pages */}
          <Route path={NAVIGATION_PATHS['Instrument Tuner']} element={<TunerPage />} />
          <Route path={NAVIGATION_PATHS['Metronome']} element={<Metronome />} />
          <Route path={NAVIGATION_PATHS['Backing Track Generator']} element={<BackingTrack />} />
          <Route path={NAVIGATION_PATHS['Rhythm Practice']} element={<RhythmTrainer />} />
          <Route path={NAVIGATION_PATHS['Tuner Calibration']} element={<TunerCalibration/>} />
          <Route path={NAVIGATION_PATHS['Chord Progression Generator']} element={<ChordStudio />} />
          <Route path={NAVIGATION_PATHS['Melody Suggestions']} element={<MelodyGenerator />} />
          <Route path={NAVIGATION_PATHS['Improvisation Partner']} element={<ImprovAssistant />} />
          <Route path={NAVIGATION_PATHS['AI Songwriting']} element={<Songwriter />} />
          <Route path={NAVIGATION_PATHS['Jam Session History']} element={<JamHistory />} />
          <Route path={NAVIGATION_PATHS['Practice Log']} element={<PracticeLog />} />
          <Route path={NAVIGATION_PATHS['Achievements']} element={<Achievements />} />
          <Route path={NAVIGATION_PATHS['Data Export']} element={<DataExport />} />
          <Route path={NAVIGATION_PATHS['Drifting Shortcuts']} element={<Shortcuts />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/builder/skill-level" replace />} />
        </Routes>
      </AppLayout>
    </InstrumentProvider>
  );
}