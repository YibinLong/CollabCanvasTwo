'use client';

import { useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { auth, db } from '@/lib/firebase/config';
import { useUserStore, generateUserColor } from '@/store/userStore';
import type { User } from '@/types/canvas';

export const useAuth = () => {
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    setCurrentUser,
    setIsAuthenticated,
    setIsLoading,
    logout: storeLogout,
  } = useUserStore();

  // Convert Firebase user to our User type
  const firebaseUserToUser = useCallback((firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
      photoURL: firebaseUser.photoURL || undefined,
      color: generateUserColor(firebaseUser.uid),
      isOnline: true,
      lastSeen: Date.now(),
    };
  }, []);

  // Save user to Firestore (skip for guest users)
  const saveUserToFirestore = useCallback(async (user: User) => {
    if (user.isGuest) return; // Don't save guest users to database
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(
        userRef,
        {
          ...user,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = firebaseUserToUser(firebaseUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        await saveUserToFirestore(user);
      } else {
        // Only reset auth state if we don't have a guest user
        const { currentUser } = useUserStore.getState();
        if (!currentUser?.isGuest) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUserToUser, saveUserToFirestore, setCurrentUser, setIsAuthenticated, setIsLoading]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = firebaseUserToUser(result.user);
      await saveUserToFirestore(user);
      return { success: true, user };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUserToUser, saveUserToFirestore, setIsLoading]);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      await updateProfile(result.user, { displayName });

      const user = firebaseUserToUser(result.user);
      user.displayName = displayName;
      await saveUserToFirestore(user);

      return { success: true, user };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUserToUser, saveUserToFirestore, setIsLoading]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = firebaseUserToUser(result.user);
      await saveUserToFirestore(user);
      return { success: true, user };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUserToUser, saveUserToFirestore, setIsLoading]);

  // Sign in as guest (no account required)
  const signInAsGuest = useCallback(async () => {
    try {
      setIsLoading(true);
      const guestId = `guest_${nanoid(10)}`;
      const guestUser: User = {
        id: guestId,
        email: '',
        displayName: `Guest ${guestId.slice(-4)}`,
        color: generateUserColor(guestId),
        isOnline: true,
        lastSeen: Date.now(),
        isGuest: true,
      };
      setCurrentUser(guestUser);
      setIsAuthenticated(true);
      return { success: true, user: guestUser };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Guest sign in failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser, setIsAuthenticated, setIsLoading]);

  // Sign out
  const logout = useCallback(async () => {
    try {
      // Update user's online status before signing out (skip for guests)
      if (currentUser && !currentUser.isGuest) {
        const userRef = doc(db, 'users', currentUser.id);
        await setDoc(
          userRef,
          {
            isOnline: false,
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        );
        await signOut(auth);
      }
      storeLogout();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      return { success: false, error: errorMessage };
    }
  }, [currentUser, storeLogout]);

  // Get user from Firestore
  const getUserFromFirestore = useCallback(async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      return null;
    }
  }, []);

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInAsGuest,
    logout,
    getUserFromFirestore,
  };
};
