'use client';

/* eslint-disable react-hooks/refs, @typescript-eslint/no-unused-vars */
import { useEffect, useCallback, useRef, useMemo } from 'react';
import type { MutableRefObject } from 'react';
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
import { useCommentStore } from '@/store/commentStore';
import type { CanvasShape, CursorPosition, User, Comment, CommentReply, CanvasVersion } from '@/types/canvas';

interface RealtimeSyncOptions {
  canvasId: string;
  userId: string;
  userName: string;
  userColor: string;
}

// Offline queue types
interface QueuedOperation {
  id: string;
  type: 'shape_update' | 'shape_delete' | 'comment_update' | 'comment_delete' | 'version_save';
  data: unknown;
  timestamp: number;
}

// Offline queue management
const offlineQueue: QueuedOperation[] = [];
let isProcessingQueue = false;

// Generate session ID outside component to maintain referential stability
let sessionCounter = 0;
const generateSessionId = (userId: string): string => {
  sessionCounter += 1;
  return `${userId}-${sessionCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useRealtimeSync = (options: RealtimeSyncOptions | null) => {
  // Use useRef to generate session ID once per component instance
  const sessionIdRef = useRef<string | null>(null);

  const { canvasId, odId, userName, userColor } = useMemo(() => {
    if (!options) {
      return { canvasId: '', odId: '', userName: '', userColor: '' };
    }
    // Generate session ID only once per hook instance
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId(options.userId);
    }
    return {
      canvasId: options.canvasId,
      odId: sessionIdRef.current,
      userName: options.userName,
      userColor: options.userColor,
    };
  }, [options]);

  const userId = options?.userId || '';

  const { shapes, setShapes, versions, setVersions } = useCanvasStore();
  const {
    setCursors,
    setOnlineUsers,
    setConnectionStatus,
    setIsConnected,
  } = useUserStore();
  const { comments, setComments } = useCommentStore();

  const isInitialized = useRef(false);
  const localShapesRef = useRef<Record<string, CanvasShape>>({});
  const localCommentsRef = useRef<Record<string, Comment>>({});
  const localVersionsRef = useRef<CanvasVersion[]>([]);
  const pendingUpdates = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingCommentUpdates = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Debounce cursor updates for performance
  const cursorUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastCursorUpdate = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Process offline queue when reconnected
  const processOfflineQueue = useCallback(async () => {
    if (isProcessingQueue || offlineQueue.length === 0 || !canvasId) return;

    isProcessingQueue = true;
    setConnectionStatus('syncing');

    while (offlineQueue.length > 0) {
      const operation = offlineQueue.shift();
      if (!operation) continue;

      try {
        switch (operation.type) {
          case 'shape_update': {
            const shape = operation.data as CanvasShape;
            const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shape.id);
            await setDoc(shapeRef, { ...shape, updatedAt: Timestamp.now() });
            break;
          }
          case 'shape_delete': {
            const shapeId = operation.data as string;
            const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shapeId);
            await deleteDoc(shapeRef);
            break;
          }
          case 'comment_update': {
            const comment = operation.data as Comment;
            const commentRef = doc(db, `canvases/${canvasId}/comments`, comment.id);
            await setDoc(commentRef, { ...comment, updatedAt: Timestamp.now() });
            break;
          }
          case 'comment_delete': {
            const commentId = operation.data as string;
            const commentRef = doc(db, `canvases/${canvasId}/comments`, commentId);
            await deleteDoc(commentRef);
            break;
          }
          case 'version_save': {
            const version = operation.data as CanvasVersion;
            const versionRef = doc(db, `canvases/${canvasId}/versions`, version.id);
            await setDoc(versionRef, { ...version, timestamp: Timestamp.fromMillis(version.timestamp) });
            break;
          }
        }
      } catch (error) {
        console.error('Error processing offline queue operation:', error);
        // Re-queue the operation
        offlineQueue.unshift(operation);
        break;
      }
    }

    isProcessingQueue = false;
    if (offlineQueue.length === 0) {
      setConnectionStatus('connected');
    }
  }, [canvasId, setConnectionStatus]);

  // Sync shapes to Firestore with offline support
  const syncShapeToFirestore = useCallback(
    async (shape: CanvasShape) => {
      if (!canvasId) return;

      const { isConnected } = useUserStore.getState();

      // If offline, queue the operation
      if (!isConnected) {
        const existingIndex = offlineQueue.findIndex(
          (op) => op.type === 'shape_update' && (op.data as CanvasShape).id === shape.id
        );
        const operation: QueuedOperation = {
          id: `${shape.id}-${Date.now()}`,
          type: 'shape_update',
          data: shape,
          timestamp: Date.now(),
        };

        if (existingIndex >= 0) {
          offlineQueue[existingIndex] = operation;
        } else {
          offlineQueue.push(operation);
        }
        return;
      }

      try {
        const shapeRef = doc(db, `canvases/${canvasId}/shapes`, shape.id);
        await setDoc(shapeRef, {
          ...shape,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error('Error syncing shape to Firestore:', error);
        // Queue for retry
        offlineQueue.push({
          id: `${shape.id}-${Date.now()}`,
          type: 'shape_update',
          data: shape,
          timestamp: Date.now(),
        });
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

  // Sync comment to Firestore
  const syncCommentToFirestore = useCallback(
    async (comment: Comment) => {
      if (!canvasId) return;

      try {
        const commentRef = doc(db, `canvases/${canvasId}/comments`, comment.id);
        await setDoc(commentRef, {
          ...comment,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error('Error syncing comment to Firestore:', error);
      }
    },
    [canvasId]
  );

  // Debounced comment sync
  const debouncedSyncComment = useCallback(
    (comment: Comment) => {
      const existingTimeout = pendingCommentUpdates.current.get(comment.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        syncCommentToFirestore(comment);
        pendingCommentUpdates.current.delete(comment.id);
      }, 100);

      pendingCommentUpdates.current.set(comment.id, timeout);
    },
    [syncCommentToFirestore]
  );

  // Sync comment deletion to Firestore
  const syncCommentDeletion = useCallback(
    async (commentId: string) => {
      if (!canvasId) return;

      try {
        const commentRef = doc(db, `canvases/${canvasId}/comments`, commentId);
        await deleteDoc(commentRef);
      } catch (error) {
        console.error('Error deleting comment from Firestore:', error);
      }
    },
    [canvasId]
  );

  // Sync version to Firestore
  const syncVersionToFirestore = useCallback(
    async (version: CanvasVersion) => {
      if (!canvasId) return;

      try {
        const versionRef = doc(db, `canvases/${canvasId}/versions`, version.id);
        await setDoc(versionRef, {
          ...version,
          timestamp: Timestamp.fromMillis(version.timestamp),
        });
      } catch (error) {
        console.error('Error syncing version to Firestore:', error);
      }
    },
    [canvasId]
  );

  // Sync version deletion to Firestore
  const syncVersionDeletion = useCallback(
    async (versionId: string) => {
      if (!canvasId) return;

      try {
        const versionRef = doc(db, `canvases/${canvasId}/versions`, versionId);
        await deleteDoc(versionRef);
      } catch (error) {
        console.error('Error deleting version from Firestore:', error);
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

        // Process any queued operations from offline mode
        processOfflineQueue();

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
  }, [canvasId, userId, odId, userName, userColor, setIsConnected, setConnectionStatus, processOfflineQueue]);

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

  // Listen to comment updates from Firestore
  useEffect(() => {
    if (!canvasId) return;

    const commentsRef = collection(db, `canvases/${canvasId}/comments`);
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const newComments: Record<string, Comment> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          newComments[docSnap.id] = {
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt,
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
            replies: (data.replies || []).map((reply: { id: string; text: string; userId: string; userName: string; userColor: string; createdAt: { toMillis?: () => number } | number }) => ({
              ...reply,
              createdAt: typeof reply.createdAt === 'number'
                ? reply.createdAt
                : (reply.createdAt?.toMillis?.() || Date.now()),
            })),
          } as Comment;
        });

        // Only update if comments have actually changed
        if (JSON.stringify(newComments) !== JSON.stringify(localCommentsRef.current)) {
          localCommentsRef.current = newComments;
          setComments(newComments);
        }
      },
      (error) => {
        console.error('Error listening to comments:', error);
      }
    );

    return () => unsubscribe();
  }, [canvasId, setComments]);

  // Sync local comment changes to Firestore
  useEffect(() => {
    const currentCommentIds = Object.keys(comments);
    const localCommentIds = Object.keys(localCommentsRef.current);

    // Find new or updated comments
    currentCommentIds.forEach((id) => {
      const currentComment = comments[id];
      const localComment = localCommentsRef.current[id];

      if (!localComment || JSON.stringify(currentComment) !== JSON.stringify(localComment)) {
        debouncedSyncComment(currentComment);
      }
    });

    // Find deleted comments
    localCommentIds.forEach((id) => {
      if (!comments[id]) {
        syncCommentDeletion(id);
      }
    });

    localCommentsRef.current = { ...comments };
  }, [comments, debouncedSyncComment, syncCommentDeletion]);

  // Listen to version updates from Firestore
  useEffect(() => {
    if (!canvasId) return;

    const versionsRef = collection(db, `canvases/${canvasId}/versions`);
    const versionsQuery = query(versionsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      versionsQuery,
      (snapshot) => {
        const newVersions: CanvasVersion[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          newVersions.push({
            ...data,
            id: docSnap.id,
            timestamp: data.timestamp?.toMillis?.() || data.timestamp,
          } as CanvasVersion);
        });

        // Only update if versions have actually changed
        if (JSON.stringify(newVersions) !== JSON.stringify(localVersionsRef.current)) {
          localVersionsRef.current = newVersions;
          setVersions(newVersions);
        }
      },
      (error) => {
        console.error('Error listening to versions:', error);
      }
    );

    return () => unsubscribe();
  }, [canvasId, setVersions]);

  // Sync local version changes to Firestore
  useEffect(() => {
    const currentVersionIds = versions.map((v) => v.id);
    const localVersionIds = localVersionsRef.current.map((v) => v.id);

    // Find new versions
    versions.forEach((version) => {
      const localVersion = localVersionsRef.current.find((v) => v.id === version.id);

      if (!localVersion) {
        syncVersionToFirestore(version);
      }
    });

    // Find deleted versions
    localVersionIds.forEach((id) => {
      if (!currentVersionIds.includes(id)) {
        syncVersionDeletion(id);
      }
    });

    localVersionsRef.current = [...versions];
  }, [versions, syncVersionToFirestore, syncVersionDeletion]);

  return {
    updateCursorPosition,
    syncShapeToFirestore,
    syncShapeDeletion,
    batchSyncShapes,
    syncCommentToFirestore,
    syncCommentDeletion,
    syncVersionToFirestore,
    syncVersionDeletion,
    processOfflineQueue,
    pendingOperations: offlineQueue.length,
    isInitialized: isInitialized.current,
  };
};
