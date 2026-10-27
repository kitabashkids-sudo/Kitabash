import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api.ts';

export interface Me {
  user: { id: string; email: string; name: string; role: 'admin' | 'instructor' | 'student' | 'guardian' } | null;
  age?: number | null;
  consent?: { ai: boolean; audio: boolean; requiresGuardian: boolean };
  permissions?: string[];
}

const Ctx = createContext<{ me: Me | null; refresh: () => Promise<void>; can: (p: string) => boolean }>({ me: null, refresh: async () => {}, can: () => false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const refresh = useCallback(async () => {
    try {
      setMe(await api<Me>('/api/me'));
    } catch {
      setMe({ user: null });
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const can = useCallback((p: string) => !!me?.permissions?.includes(p), [me]);
  return <Ctx.Provider value={{ me, refresh, can }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
