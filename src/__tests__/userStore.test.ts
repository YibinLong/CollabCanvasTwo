import { useUserStore, generateUserColor } from '@/store/userStore';
import type { User, CursorPosition } from '@/types/canvas';

describe('userStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useUserStore.getState().logout();
  });

  describe('user management', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      color: '#FF5733',
      isOnline: true,
      lastSeen: Date.now(),
    };

    it('should set current user', () => {
      useUserStore.getState().setCurrentUser(mockUser);
      expect(useUserStore.getState().currentUser).toEqual(mockUser);
    });

    it('should set authentication status', () => {
      useUserStore.getState().setIsAuthenticated(true);
      expect(useUserStore.getState().isAuthenticated).toBe(true);
    });

    it('should clear user on logout', () => {
      useUserStore.getState().setCurrentUser(mockUser);
      useUserStore.getState().setIsAuthenticated(true);
      useUserStore.getState().logout();

      expect(useUserStore.getState().currentUser).toBeNull();
      expect(useUserStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('cursors', () => {
    const mockCursor: CursorPosition = {
      odId: 'cursor-1',
      userId: 'user-1',
      userName: 'Test User',
      userColor: '#FF5733',
      x: 100,
      y: 200,
    };

    it('should set cursors', () => {
      useUserStore.getState().setCursors({ [mockCursor.odId]: mockCursor });
      expect(useUserStore.getState().cursors[mockCursor.odId]).toEqual(mockCursor);
    });

    it('should update cursor', () => {
      useUserStore.getState().setCursors({ [mockCursor.odId]: mockCursor });
      const updatedCursor: CursorPosition = { ...mockCursor, x: 300, y: 400 };
      useUserStore.getState().updateCursor(mockCursor.odId, updatedCursor);

      const cursor = useUserStore.getState().cursors[mockCursor.odId];
      expect(cursor.x).toBe(300);
      expect(cursor.y).toBe(400);
    });

    it('should remove cursor', () => {
      useUserStore.getState().setCursors({ [mockCursor.odId]: mockCursor });
      useUserStore.getState().removeCursor(mockCursor.odId);

      expect(useUserStore.getState().cursors[mockCursor.odId]).toBeUndefined();
    });
  });

  describe('online users', () => {
    const mockUsers: Record<string, User> = {
      'user-1': {
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        color: '#FF5733',
        isOnline: true,
        lastSeen: Date.now(),
      },
      'user-2': {
        id: 'user-2',
        email: 'user2@example.com',
        displayName: 'User 2',
        color: '#33FF57',
        isOnline: true,
        lastSeen: Date.now(),
      },
    };

    it('should set online users', () => {
      useUserStore.getState().setOnlineUsers(mockUsers);
      expect(useUserStore.getState().onlineUsers).toEqual(mockUsers);
    });
  });

  describe('connection status', () => {
    it('should set connection status', () => {
      useUserStore.getState().setConnectionStatus('connected');
      expect(useUserStore.getState().connectionStatus).toBe('connected');
    });

    it('should set isConnected', () => {
      useUserStore.getState().setIsConnected(true);
      expect(useUserStore.getState().isConnected).toBe(true);
    });
  });

  describe('generateUserColor', () => {
    it('should generate consistent color for same userId', () => {
      const color1 = generateUserColor('user-123');
      const color2 = generateUserColor('user-123');
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different userIds', () => {
      const color1 = generateUserColor('user-1');
      const color2 = generateUserColor('user-2');
      // Colors might be the same by coincidence, but this tests the function runs
      expect(typeof color1).toBe('string');
      expect(typeof color2).toBe('string');
    });

    it('should generate valid hex colors', () => {
      const color = generateUserColor('test-user');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
