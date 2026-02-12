import { useState, useEffect, useCallback } from 'react';
import { checkAuth, requestMagicLink, verifyToken, logout as apiLogout, getUserEmail } from '../utils/api';
import { syncFromServer } from '../utils/storageManager';

export type AuthState = 'loading' | 'anonymous' | 'authenticated';

export interface AuthHandle {
  authState: AuthState;
  email: string | null;
  login: (email: string) => Promise<{ success: boolean; message: string }>;
  verify: (token: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthHandle {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    checkAuth().then(({ authenticated, email: userEmail }) => {
      setAuthState(authenticated ? 'authenticated' : 'anonymous');
      setEmail(userEmail || getUserEmail());
      if (authenticated) {
        syncFromServer();
      }
    });
  }, []);

  const login = useCallback(async (userEmail: string) => {
    return requestMagicLink(userEmail);
  }, []);

  const verify = useCallback(async (token: string) => {
    const result = await verifyToken(token);
    if (result.session_token) {
      setAuthState('authenticated');
      setEmail(result.email || null);
      await syncFromServer();
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAuthState('anonymous');
    setEmail(null);
  }, []);

  return { authState, email, login, verify, logout };
}
