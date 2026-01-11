'use client';

import React, { useEffect, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { CanvasPage } from '@/components/CanvasPage';

// Initialize canvas ID outside of component to avoid re-renders
const getInitialCanvasId = (): string => {
  if (typeof window === 'undefined') return '';

  const urlParams = new URLSearchParams(window.location.search);
  const urlCanvasId = urlParams.get('canvas');

  if (urlCanvasId) return urlCanvasId;

  const savedCanvasId = localStorage.getItem('lastCanvasId');
  if (savedCanvasId) return savedCanvasId;

  const newCanvasId = nanoid(10);
  localStorage.setItem('lastCanvasId', newCanvasId);
  return newCanvasId;
};

export default function Home() {
  const { isAuthenticated, isLoading, currentUser } = useAuth();

  // Use useMemo to compute canvas ID only once on client
  const canvasId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return getInitialCanvasId();
  }, []);

  // Save canvas ID to URL when it changes
  useEffect(() => {
    if (canvasId && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('canvas', canvasId);
      window.history.replaceState({}, '', url.toString());
      localStorage.setItem('lastCanvasId', canvasId);
    }
  }, [canvasId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <p className="text-gray-500">Loading CollabCanvas...</p>
        </div>
      </div>
    );
  }

  // Auth state - show login form
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <AuthForm />
      </div>
    );
  }

  // Main canvas view
  if (!canvasId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Initializing canvas...</p>
        </div>
      </div>
    );
  }

  return <CanvasPage canvasId={canvasId} />;
}
