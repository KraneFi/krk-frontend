import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Small in-memory router. Paths mirror the prototype's routes
// (/, /checks, /checks/:id, /checks/new, /decision-engine, /loan-queue,
// /servicing, /api, /users, /compliance, /settings). It keeps the app runnable
// inside sandboxed frames; swap in react-router when hosting it yourself.
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [path, setPath] = useState('/');
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const navigate = useCallback((to) => {
    setPath(to);
    document.getElementById('kk-main')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  const notify = useCallback((msg) => {
    clearTimeout(timer.current);
    setToast({ msg, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return <Ctx.Provider value={{ path, navigate, toast, notify }}>{children}</Ctx.Provider>;
}

export function Link({ to, className = '', children, ...rest }) {
  const { navigate } = useApp();
  return (
    <a href="#" className={className} onClick={(e) => { e.preventDefault(); navigate(to); }} {...rest}>
      {children}
    </a>
  );
}
