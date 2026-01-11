'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ref,
  onValue,
  set,
  remove,
  onDisconnect,
  serverTimestamp,
  DataSnapshot,
} from 'firebase/database';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { rtdb, db } from '@/lib/firebase/config';
import { useCanvasStore } from '@/store/canvasStore';
import { useUserStore } from '@/store/userStore';
import type { CanvasShape, CursorPosition, User } from '@/types/canvas';

interface RealtimeSyncOptions {
  canvasId: string;
  userId: string;
  userName: string;
  userColor: string;
}

export const useRealtimeSync = (options: RealtimeSyncOptions | null) => {
  const { canvasId, odId, userName, userColor } = useMemo(() => {
    if (!options) {
      return { canvasId: '', odId: '', userName: '', userColor: '' };
    }
    // Generate a unique session ID for cursor tracking
    const sessionId = `${options.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      canvasId: options.canvasId,
      odId: sessionId,
      userName: options.userName,
      userColor: options.userColor,
    };
  }, [options]);

  const userId = options?.userId || '';

  const { shapes, setShapes } = useCanvasStore();
  const {
    setCursors,
    setOnlineUsers,
    setConnectionStatus,
    setIsConnected,
  } = useUserStore();

  const isInitialized = useRef(false);
  const localShapesRef = useRef<Record<string, CanvasShape>>({});
  const pendingUpdates = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Debounce cursor updates for performance
  const cursorUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastCursorUpdate = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync shapes to Firestore
  const syncShapeToFirestore = useCallback(
    async (shape: CanvasShape) => {
      if (!canvasId) return;

      try {
        const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shape.id);
        await setDoc(shapeRef, {
          ...shape,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error('Error syncing shape to Firestore:', error);
      }
    },
    [canvasId]
  );

  // Debounced shape sync (to reduce write frequency)
  const debouncedSyncShape = useCallback(
    (shape: CanvasShape) => {
      const existingTimeout = pendingUpdates.current.get(shape.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        syncShapeToFirestore(shape);
        pendingUpdates.current.delete(shape.id);
      }, 100); // 100ms debounce

      pendingUpdates.current.set(shape.id, timeout);
    },
    [syncShapeToFirestore]
  );

  // Sync shape deletion to Firestore
  const syncShapeDeletion = useCallback(
    async (shapeId: string) => {
      if (!canvasId) return;

      try {
        const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shapeId);
        await deleteDoc(shapeRef);
      } catch (error) {
        console.error('Error deleting shape from Firestore:', error);
      }
    },
    [canvasId]
  );

  // Batch sync multiple shapes
  const batchSyncShapes = useCallback(
    async (shapesToSync: CanvasShape[]) => {
      if (!canvasId || shapesToSync.length === 0) return;

      try {
        const batch = writeBatch(db);
        shapesToSync.forEach((shape) => {
          const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shape.id);
          batch.set(shapeRef, {
            ...shape,
            updatedAt: Timestamp.now(),
          });
        });
        await batch.commit();
      } catch (error) {
        console.error('Error batch syncing shapes:', error);
      }
    },
    [canvasId]
  );

  // Update cursor position in Realtime Database
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!canvasId || !userId || !odId) return;

      // Throttle cursor updates (max 20 updates per second)
      const distance = Math.sqrt(
        Math.pow(x - lastCursorUpdate.current.x, 2) +
          Math.pow(y - lastCursorUpdate.current.y, 2)
      );

      // Only update if moved significantly (> 5px) or enough time has passed
      if (distance < 5) return;

      lastCursorUpdate.current = { x, y };

      if (cursorUpdateTimeout.current) {
        clearTimeout(cursorUpdateTimeout.current);
      }

      cursorUpdateTimeout.current = setTimeout(() => {
        const cursorRef = ref(rtdb, `canvases/${canvasId}/cursors/${odId}`);
        set(cursorRef, {
          odId,
          x,
          y,
          userId,
          userName,
          userColor,
          timestamp: serverTimestamp(),
        });
      }, 30); // ~33 updates per second max
    },
    [canvasId, userId, odId, userName, userColor]
  );

  // Set up presence in Realtime Database
  const setupPresence = useCallback(() => {
    if (!canvasId || !userId || !odId) return;

    const presenceRef = ref(rtdb, `canvases/${canvasId}/presence/${userId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        setIsConnected(true);
        setConnectionStatus('connected');

        // Set user presence
        set(presenceRef, {
          odId,
          userId,
          userName,
          userColor,
          isOnline: true,
          lastSeen: serverTimestamp(),
        });

        // Set up disconnect cleanup
        onDisconnect(presenceRef).remove();
        onDisconnect(ref(rtdb, `canvases/${canvasId}/cursors/${odId}`)).remove();
      } else {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    });

    return () => {
      unsubscribe();
      remove(presenceRef);
      remove(ref(rtdb, `canvases/${canvasId}/cursors/${odId}`));
    };
  }, [canvasId, userId, odId, userName, userColor, setIsConnected, setConnectionStatus]);

  // Listen to cursor updates from Realtime Database
  useEffect(() => {
    if (!canvasId || !userId) return;

    const cursorsRef = ref(rtdb, `canvases/${canvasId}/cursors`);

    const unsubscribe = onValue(cursorsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        setCursors({});
        return;
      }

      const newCursors: Record<string, CursorPosition> = {};
      Object.entries(data).forEach(([cursorId, cursor]) => {
        // Don't include own cursor
        const cursorData = cursor as CursorPosition;
        if (cursorData.userId !== userId) {
          newCursors[cursorId] = cursorData;
        }
      });

      setCursors(newCursors);
    });

    return () => unsubscribe();
  }, [canvasId, userId, setCursors]);

  // Listen to presence updates from Realtime Database
  useEffect(() => {
    if (!canvasId) return;

    const presenceRef = ref(rtdb, `canvases/${canvasId}/presence`);

    const unsubscribe = onValue(presenceRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOnlineUsers({});
        return;
      }

      const users: Record<string, User> = {};
      Object.entries(data).forEach(([odId, userData]) => {
        const user = userData as { odId: string; userId: string; userName: string; userColor: string };
        users[odId] = {
          id: user.userId || odId,
          email: '',
          displayName: user.userName,
          color: user.userColor,
          isOnline: true,
          lastSeen: Date.now(),
        };
      });

      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, [canvasId, setOnlineUsers]);

  // Listen to shape updates from Firestore
  useEffect(() => {
    if (!canvasId) return;

    const shapesRef = collection(db, `canvases/${canvasId}/shapes`);
    const shapesQuery = query(shapesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      shapesQuery,
      (snapshot) => {
        const newShapes: Record<string, CanvasShape> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          newShapes[docSnap.id] = {
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt,
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
          } as CanvasShape;
        });

        // Only update if shapes have actually changed
        if (JSON.stringify(newShapes) !== JSON.stringify(localShapesRef.current)) {
          localShapesRef.current = newShapes;
          setShapes(newShapes);
        }

        if (!isInitialized.current) {
          isInitialized.current = true;
        }
      },
      (error) => {
        console.error('Error listening to shapes:', error);
        setConnectionStatus('disconnected');
      }
    );

    return () => unsubscribe();
  }, [canvasId, setShapes, setConnectionStatus]);

  // Set up presence on mount
  useEffect(() => {
    if (!canvasId || !userId) return;

    const cleanup = setupPresence();
    return cleanup;
  }, [canvasId, userId, setupPresence]);

  // Sync local shape changes to Firestore
  useEffect(() => {
    // Compare current shapes with local reference and sync differences
    const currentShapeIds = Object.keys(shapes);
    const localShapeIds = Object.keys(localShapesRef.current);

    // Find new or updated shapes
    currentShapeIds.forEach((id) => {
      const currentShape = shapes[id];
      const localShape = localShapesRef.current[id];

      if (!localShape || JSON.stringify(currentShape) !== JSON.stringify(localShape)) {
        debouncedSyncShape(currentShape);
      }
    });

    // Find deleted shapes
    localShapeIds.forEach((id) => {
      if (!shapes[id]) {
        syncShapeDeletion(id);
      }
    });

    localShapesRef.current = { ...shapes };
  }, [shapes, debouncedSyncShape, syncShapeDeletion]);

  return {
    updateCursorPosition,
    syncShapeToFirestore,
    syncShapeDeletion,
    batchSyncShapes,
    isInitialized: isInitialized.current,
  };
};
