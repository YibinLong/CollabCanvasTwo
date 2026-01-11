import { create } from 'zustand';
import type { User, CursorPosition } from '@/types/canvas';

interface UserStore {
  // Current user
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Online users
  onlineUsers: Record<string, User>;
  cursors: Record<string, CursorPosition>;

  // Connection status
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

  // Actions
  setCurrentUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;

  setOnlineUsers: (users: Record<string, User>) => void;
  addOnlineUser: (user: User) => void;
  removeOnlineUser: (userId: string) => void;
  updateOnlineUser: (userId: string, updates: Partial<User>) => void;

  setCursors: (cursors: Record<string, CursorPosition>) => void;
  updateCursor: (userId: string, cursor: CursorPosition) => void;
  removeCursor: (userId: string) => void;

  setIsConnected: (isConnected: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting') => void;

  logout: () => void;
}

// Generate a consistent user color based on user ID
export const generateUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    '#FF69B4', '#32CD32', '#FF4500', '#9370DB',
  ];

  // Create a hash from user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
};

export const useUserStore = create<UserStore>((set) => ({
  // Initial state
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  onlineUsers: {},
  cursors: {},
  isConnected: false,
  connectionStatus: 'disconnected',

  // User actions
  setCurrentUser: (user) => set({ currentUser: user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // Online users actions
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (user) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [user.id]: user },
    })),
  removeOnlineUser: (userId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [userId]: _removed, ...rest } = state.onlineUsers;
      return { onlineUsers: rest };
    }),
  updateOnlineUser: (userId, updates) =>
    set((state) => {
      const user = state.onlineUsers[userId];
      if (!user) return state;
      return {
        onlineUsers: {
          ...state.onlineUsers,
          [userId]: { ...user, ...updates },
        },
      };
    }),

  // Cursor actions
  setCursors: (cursors) => set({ cursors }),
  updateCursor: (odId, cursor) =>
    set((state) => ({
      cursors: { ...state.cursors, [odId]: cursor },
    })),
  removeCursor: (odId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [odId]: _removed, ...rest } = state.cursors;
      return { cursors: rest };
    }),

  // Connection actions
  setIsConnected: (isConnected) => set({ isConnected }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Logout
  logout: () =>
    set({
      currentUser: null,
      isAuthenticated: false,
      onlineUsers: {},
      cursors: {},
      isConnected: false,
      connectionStatus: 'disconnected',
    }),
}));
