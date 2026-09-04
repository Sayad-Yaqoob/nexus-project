'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, logoutFirebase } from '@/lib/firebase';
import { api, apiUrl } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'expert' | 'client' | 'dual';
  public_handle?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  userContext: any | null;
  loading: boolean;
  token: string | null;
  logout: () => Promise<void>;
  setDemoUser: (user: UserProfile) => void;
  refreshUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  userContext: null,
  loading: true,
  token: null,
  logout: async () => {},
  setDemoUser: () => {},
  refreshUserContext: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>({
    id: "1",
    email: "sayad@mindgigs.com",
    full_name: "Sayad Yaqoob",
    role: "expert",
    public_handle: "sayad"
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userContext, setUserContext] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchContext = async () => {
    try {
      const data: any = await fetch(apiUrl('/users/me'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).then(r => r.json()).catch(() => null);
      if (data && data.user) {
        setUserContext(data);
        setUser(data.user);
      }
    } catch (e) {
      console.warn("User context fetch warning:", e);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          api.setToken(idToken);

          const res: any = await fetch(apiUrl('/auth/verify'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({
              token: idToken,
              email: fbUser.email,
              uid: fbUser.uid,
              full_name: fbUser.displayName || fbUser.email?.split('@')[0] || "User"
            })
          }).then(r => r.json()).catch(() => null);

          if (res && res.user) {
            setUser(res.user);
            await fetchContext();
          } else {
            setUser({
              id: fbUser.uid,
              email: fbUser.email || "user@mindgigs.com",
              full_name: fbUser.displayName || "MindGigs Member",
              role: "expert",
              public_handle: fbUser.email?.split('@')[0] || "user"
            });
          }
        } catch (err) {
          console.error("Auth state verify error:", err);
        }
      } else {
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutFirebase();
    setUser(null);
    setFirebaseUser(null);
    setUserContext(null);
    setToken(null);
  };

  const setDemoUser = (newUser: UserProfile) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, userContext, loading, token, logout, setDemoUser, refreshUserContext: fetchContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
