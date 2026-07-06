import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { getMenuItemsForRole } from './permissions';

const NavigationHistoryContext = createContext(null);

function labelForPath(path, role) {
  if (!path || path === '/') return 'Dashboard';
  const items = role ? getMenuItemsForRole(role) : [];
  const match = items.find(
    (m) => m.path === path || (m.path !== '/' && path.startsWith(m.path))
  );
  if (match) return match.label;
  const segment = path.split('/').filter(Boolean).pop() || 'page';
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NavigationHistoryProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const stackRef = useRef(['/']);
  const skipRef = useRef(false);
  const [previousPath, setPreviousPath] = useState('/');

  useEffect(() => {
    const path = location.pathname || '/';
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const stack = stackRef.current;
    if (stack[stack.length - 1] !== path) {
      stack.push(path);
      if (stack.length > 40) stack.splice(0, stack.length - 40);
    }
    setPreviousPath(stack.length > 1 ? stack[stack.length - 2] : '/');
  }, [location.pathname]);

  const canGoBack = location.pathname !== '/';

  const goBack = useCallback(() => {
    const stack = stackRef.current;
    if (stack.length <= 1) {
      navigate('/');
      return;
    }
    stack.pop();
    const prev = stack[stack.length - 1] || '/';
    skipRef.current = true;
    navigate(prev);
  }, [navigate]);

  const previousLabel = labelForPath(previousPath, user?.role);

  const value = {
    canGoBack,
    goBack,
    previousLabel,
    currentPath: location.pathname,
  };

  return (
    <NavigationHistoryContext.Provider value={value}>{children}</NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const ctx = useContext(NavigationHistoryContext);
  if (!ctx) {
    return {
      canGoBack: false,
      goBack: () => {},
      previousLabel: 'Dashboard',
      currentPath: '/',
    };
  }
  return ctx;
}
