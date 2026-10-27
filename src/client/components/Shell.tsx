import { useEffect, useState, type ReactNode } from 'react';
import { Link, navigate, useRoute } from '../lib/router.tsx';
import { useSession } from '../lib/session.tsx';
import { api } from '../lib/api.ts';
import { Icon } from './ui.tsx';

const NAV: Record<string, { to: string; label: string; icon: string }[]> = {
  student: [
    { to: '/', label: 'My learning', icon: 'home' },
    { to: '/catalog', label: 'Explore', icon: 'search' },
  ],
  instructor: [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/teach', label: 'Teach', icon: 'screen' },
    { to: '/catalog', label: 'Catalogue', icon: 'search' },
  ],
  admin: [
    { to: '/admin', label: 'Studio', icon: 'layers' },
    { to: '/teach', label: 'Teach', icon: 'screen' },
    { to: '/catalog', label: 'Catalogue', icon: 'search' },
    { to: '/admin/library', label: 'Library', icon: 'image' },
    { to: '/admin/platform', label: 'Platform', icon: 'plug' },
  ],
  guardian: [{ to: '/', label: 'My child', icon: 'heart' }],
};

export function Logo({ small }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-display font-black tracking-tight">
      <svg viewBox="0 0 64 64" className={small ? 'size-7' : 'size-9'} aria-hidden>
        <rect width="64" height="64" rx="16" fill="var(--accent)" />
        <path d="M18 16h8v13l12-13h10L35 30l14 18H39L29 35l-3 3v10h-8z" fill="#fff" />
      </svg>
      <span className={small ? 'text-lg' : 'text-xl'}>Kitabash</span>
    </span>
  );
}

export function useColorMode() {
  const [mode, setMode] = useState<string>(() => {
    try {
      return localStorage.getItem('kb-mode') || 'auto';
    } catch {
      return 'auto';
    }
  });
  useEffect(() => {
    if (mode === 'auto') document.documentElement.removeAttribute('data-mode');
    else document.documentElement.setAttribute('data-mode', mode);
    try {
      localStorage.setItem('kb-mode', mode);
    } catch {}
  }, [mode]);
  return [mode, setMode] as const;
}

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { me, refresh } = useSession();
  const { path } = useRoute();
  const [mode, setMode] = useColorMode();
  const role = me?.user?.role || 'student';
  const items = NAV[role] || [];
  const isActive = (to: string) => (to === '/' ? path === '/' : path.startsWith(to));
  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    await refresh();
    navigate('/login');
  };
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur hide-in-projection">
        <div className={`mx-auto flex h-16 items-center gap-3 px-4 ${wide ? 'max-w-[1500px]' : 'max-w-6xl'}`}>
          <Link to="/" aria-label="Kitabash home">
            <Logo small />
          </Link>
          <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main">
            {items.map((n) => (
              <Link key={n.to} to={n.to} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${isActive(n.to) ? 'bg-ink text-paper' : 'text-muted hover:bg-sunk hover:text-ink'}`}>
                <Icon name={n.icon} size={15} />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button className="grid size-9 place-items-center rounded-full text-muted hover:bg-sunk" aria-label={`Colour mode: ${mode}`} title={`Colour mode: ${mode}`} onClick={() => setMode(mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto')}>
              <Icon name={mode === 'dark' ? 'moon' : 'sun'} />
            </button>
            {me?.user && (
              <>
                <span className="hidden items-center gap-2 rounded-full bg-sunk py-1 pr-3 pl-1 text-sm font-semibold sm:inline-flex">
                  <span className="grid size-7 place-items-center rounded-full bg-accent font-display text-xs font-black text-white">{me.user.name[0]}</span>
                  {me.user.name.split(' (')[0]}
                  <span className="text-xs font-medium text-muted capitalize">· {role}</span>
                </span>
                <button onClick={logout} className="grid size-9 place-items-center rounded-full text-muted hover:bg-sunk" aria-label="Sign out" title="Sign out">
                  <Icon name="logout" />
                </button>
              </>
            )}
          </div>
        </div>
        {/* mobile nav */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden" aria-label="Main (mobile)">
          {items.map((n) => (
            <Link key={n.to} to={n.to} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${isActive(n.to) ? 'bg-ink text-paper' : 'text-muted'}`}>
              <Icon name={n.icon} size={15} />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className={`mx-auto px-4 py-8 ${wide ? 'max-w-[1500px]' : 'max-w-6xl'}`}>{children}</main>
    </div>
  );
}
