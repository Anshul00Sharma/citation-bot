import { create } from 'zustand';

interface SessionStore {
  sessionId: string | null;
  fileId: string | null;
  isLoading: boolean;
  setSessionId: (id: string) => void;
  setFileId: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId:
    typeof window !== 'undefined'
      ? sessionStorage.getItem('session_id')
      : null,
  fileId: null,
  isLoading: false,
  setSessionId: (id) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('session_id', id);
    }
    set({ sessionId: id });
  },
  setFileId: (id) => set({ fileId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
