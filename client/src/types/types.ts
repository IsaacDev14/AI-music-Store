/**
 * =========================================================
 * CORE DATA MODELS (Mirrors FastAPI/SQLAlchemy models)
 * =========================================================
 */

// --- INSTRUMENTS ---
export interface IInstrument {
  id: number;
  name: string;
  type: string;
  // Relationships (optional to include full objects here, often simpler to use IDs)
  // lessons?: ILesson[];
}

// --- USER SETTINGS ---
export interface IUserSettings {
  id: number;
  user_id: number;
  tuning_reference: string; // e.g., 'A440'
  preferred_metronome_tempo: number; // e.g., 120
  created_at: string;
  updated_at: string;
}

// --- USER ---
export interface IUser {
  id: number;
  name: string;
  email: string;
  skill_level: string; // e.g., 'beginner', 'intermediate', 'expert'
  created_at: string;
  updated_at: string;
  
  // Relationships
  instruments?: IInstrument[];
  settings?: IUserSettings;
}

// --- LESSONS ---
export interface ILesson {
  id: number;
  title: string;
  lesson_type: string; // e.g., 'theory', 'technique', 'ear_training'
  instrument_id: number;
  difficulty: string; // e.g., 'easy', 'medium', 'hard'
  content: string; // Markdown or raw text content
  created_at: string;
  updated_at: string;

  // Foreign Key Relationships
  instrument?: IInstrument;
}

// --- SONGS ---
export interface ISong {
  id: number;
  title: string;
  artist: string;
  genre: string;
  created_at: string;
}

// --- CHORD PROGRESSIONS ---
export interface IChordProgression {
  id: number;
  user_id: number;
  song_id?: number; // Optional: Link to a known song
  instrument_id: number;
  progression: string; // Serialized string representation of the chord progression (e.g., 'Cmaj7 | Fmaj7 | G7 | Cmaj7')
  skill_level: string;
  created_at: string;
}

// --- MELODIES ---
export interface IMelody {
  id: number;
  user_id: number;
  instrument_id: number;
  melody_data: string; // Serialized string (e.g., MusicXML or JSON representation of notes)
  created_at: string;
}

// --- PRACTICE SESSIONS ---
export interface IPracticeSession {
  id: number;
  user_id: number;
  lesson_id?: number; // Optional: Session tied to a specific lesson
  song_id?: number;   // Optional: Session tied to a specific song
  duration_minutes: number;
  feedback: string; // AI-generated feedback text
  created_at: string;
}

// --- USER SONGS (Join Table data structure if needed for API) ---
export interface IUserSong {
  id: number;
  user_id: number;
  song_id: number;
  created_at: string;
}


/**
 * =========================================================
 * API PAYLOAD TYPES (For sending data to the server)
 * =========================================================
 */

// Type for the data received after a successful login/signup
export interface IAuthResponse {
  access_token: string;
  token_type: 'bearer';
  user_id: number;
  user_name: string;
}

// Type for the login form submission
export interface ILoginPayload {
  email: string;
  password: string;
}

// Type for the signup form submission
export interface ISignUpPayload {
  name: string;
  email: string;
  password: string;
  // The user will select a starter instrument and skill level on signup, 
  // but we can handle that with a subsequent API call for simplicity.
}

// Type for AI generation requests
export interface IAIGenerationPayload {
  prompt: string; // The user's natural language request
  genre: string;
  instrument: string;
  key?: string; // Optional musical key
  tempo?: number; // Optional tempo (BPM)
  duration_seconds?: number; // Optional duration
}

// Type for AI generation response (e.g., a new Chord Progression or Melody structure)
export interface IAIGenerationResponse {
  id: number; // ID of the newly created object (e.g., ChordProgression ID)
  type: 'chord_progression' | 'melody';
  generated_data: IChordProgression | IMelody; // The actual generated data object
  ai_feedback: string; // Text summary of what the AI created
}


/**
 * =========================================================
 * CONTEXT/STATE TYPES
 * =========================================================
 */

// Defines the shape of the user state in AuthContext
export interface IUserState {
  id: number | null;
  name: string | null;
  isAuthenticated: boolean;
  token: string | null;
}

// Defines the shape of the instrument state in InstrumentContext
export interface IInstrumentState {
  activeInstrument: IInstrument | null;
  skillLevel: string;
  availableInstruments: IInstrument[];
}