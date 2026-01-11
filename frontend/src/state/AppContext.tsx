import { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import type { ResumeUploadResponse, JdGapResult } from '../api/client';

// ============================================
// Types
// ============================================

interface AppState {
  sessionId: string | null;
  apiKey: string | null;
  resumeInfo: ResumeUploadResponse | null;
  jdText: string;
  targetRole: string;
  result: JdGapResult | null;
  error: string | null;
  backendOnline: boolean | null;
}

type Action =
  | { type: 'SET_SESSION'; payload: string }
  | { type: 'SET_API_KEY'; payload: string | null }
  | { type: 'SET_RESUME'; payload: ResumeUploadResponse | null }
  | { type: 'SET_JD'; payload: { jdText: string; targetRole: string } }
  | { type: 'SET_RESULT'; payload: JdGapResult }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BACKEND_ONLINE'; payload: boolean }
  | { type: 'RESET_ALL' };

interface AppContextValue extends AppState {
  dispatch: React.Dispatch<Action>;
  setSession: (sessionId: string) => void;
  setApiKey: (key: string | null) => void;
  setResume: (info: ResumeUploadResponse | null) => void;
  setJd: (jdText: string, targetRole: string) => void;
  setResult: (result: JdGapResult) => void;
  setError: (error: string | null) => void;
  setBackendOnline: (online: boolean) => void;
  resetAll: () => void;
}

// ============================================
// Initial State & Reducer
// ============================================

const SESSION_KEY = 'career_trainer_session_id';
const API_KEY_STORAGE = 'career_trainer_openai_key';

const initialState: AppState = {
  sessionId: null,
  apiKey: null,
  resumeInfo: null,
  jdText: '',
  targetRole: '',
  result: null,
  error: null,
  backendOnline: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
    case 'SET_RESUME':
      return { ...state, resumeInfo: action.payload };
    case 'SET_JD':
      return { ...state, jdText: action.payload.jdText, targetRole: action.payload.targetRole };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_BACKEND_ONLINE':
      return { ...state, backendOnline: action.payload };
    case 'RESET_ALL':
      // Clear localStorage too
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(API_KEY_STORAGE);
      return { ...initialState, backendOnline: state.backendOnline };
    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load stored values on mount
  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    const storedKey = localStorage.getItem(API_KEY_STORAGE);
    if (storedSession) {
      dispatch({ type: 'SET_SESSION', payload: storedSession });
    }
    if (storedKey) {
      dispatch({ type: 'SET_API_KEY', payload: storedKey });
    }
  }, []);

  // Action helpers
  const setSession = useCallback((sessionId: string) => {
    localStorage.setItem(SESSION_KEY, sessionId);
    dispatch({ type: 'SET_SESSION', payload: sessionId });
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
    dispatch({ type: 'SET_API_KEY', payload: key });
  }, []);

  const setResume = useCallback((info: ResumeUploadResponse | null) => {
    dispatch({ type: 'SET_RESUME', payload: info });
  }, []);

  const setJd = useCallback((jdText: string, targetRole: string) => {
    dispatch({ type: 'SET_JD', payload: { jdText, targetRole } });
  }, []);

  const setResult = useCallback((result: JdGapResult) => {
    dispatch({ type: 'SET_RESULT', payload: result });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setBackendOnline = useCallback((online: boolean) => {
    dispatch({ type: 'SET_BACKEND_ONLINE', payload: online });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const value: AppContextValue = {
    ...state,
    dispatch,
    setSession,
    setApiKey,
    setResume,
    setJd,
    setResult,
    setError,
    setBackendOnline,
    resetAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}

