/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Firebase before any imports
jest.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
  rtdb: {},
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  collection: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  query: jest.fn(),
  orderBy: jest.fn(),
  writeBatch: jest.fn(),
  deleteDoc: jest.fn(),
  Timestamp: { now: jest.fn() },
}));

// Mock Firebase Database
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn(() => jest.fn()),
  set: jest.fn(),
  remove: jest.fn(),
  onDisconnect: jest.fn(() => ({ remove: jest.fn() })),
  serverTimestamp: jest.fn(),
}));

// Mock Konva components
jest.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="layer">{children}</div>,
  Rect: () => <div data-testid="rect" />,
  Circle: () => <div data-testid="circle" />,
  RegularPolygon: () => <div data-testid="polygon" />,
  Star: () => <div data-testid="star" />,
  Line: () => <div data-testid="line" />,
  Text: () => <div data-testid="text" />,
  Group: ({ children }: { children: React.ReactNode }) => <div data-testid="group">{children}</div>,
  Transformer: () => <div data-testid="transformer" />,
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'mock-nanoid-id',
}));

describe('UI Components', () => {
  describe('AuthForm', () => {
    it('should render login form', async () => {
      const { AuthForm } = await import('@/components/auth/AuthForm');
      render(<AuthForm />);

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('should toggle between login and signup', async () => {
      const { AuthForm } = await import('@/components/auth/AuthForm');
      render(<AuthForm />);

      // Click on "Sign Up" tab (now uses role="tab")
      const signUpTab = screen.getByRole('tab', { name: /create a new account/i });
      fireEvent.click(signUpTab);

      // Should now show name field for signup
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    });
  });

  describe('Toolbar', () => {
    it('should render toolbar with tools', async () => {
      const { Toolbar } = await import('@/components/toolbar/Toolbar');
      render(<Toolbar />);

      // Check for core tool buttons (using title attributes)
      expect(screen.getByTitle('Select (V)')).toBeInTheDocument();
      expect(screen.getByTitle('Hand (H)')).toBeInTheDocument();
      expect(screen.getByTitle('Rectangle (R)')).toBeInTheDocument();
    });

    it('should change tool when clicked', async () => {
      const { Toolbar } = await import('@/components/toolbar/Toolbar');
      render(<Toolbar />);

      const rectBtn = screen.getByTitle('Rectangle (R)');
      fireEvent.click(rectBtn);

      // The button should be highlighted (has bg-blue-500 class)
      expect(rectBtn.className).toContain('bg-blue-500');
    });
  });
});
