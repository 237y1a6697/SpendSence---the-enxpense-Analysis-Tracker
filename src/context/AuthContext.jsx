import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is not initialized (due to missing config), just set loading false
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    if(!auth) return Promise.reject("Firebase not configured");
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  const signup = (email, password) => {
    if(!auth) return Promise.reject("Firebase not configured");
    return createUserWithEmailAndPassword(auth, email, password);
  }

  const loginWithGoogle = () => {
    if(!auth) return Promise.reject("Firebase not configured");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  const logout = () => {
    if(!auth) return Promise.reject("Firebase not configured");
    return signOut(auth);
  }

  const value = {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
