'use client';

import React, { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { CanvasPage } from '@/components/CanvasPage';

export default function Home() {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const [canvasId, setCanvasId] = useState<string>('');

  // Generate or retrieve canvas ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCanvasId = urlParams.get('canvas');

      if (urlCanvasId) {
        setCanvasId(urlCanvasId);
      } else {
        // Check localStorage for last used canvas
        const savedCanvasId = localStorage.getItem('lastCanvasId');
        if (savedCanvasId) {
          setCanvasId(savedCanvasId);
        } else {
          // Generate new canvas ID
          const newCanvasId = nanoid(10);
          setCanvasId(newCanvasId);
          localStorage.setItem('lastCanvasId', newCanvasId);
        }
      }
    }
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
