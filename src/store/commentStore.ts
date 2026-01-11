import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Comment, CommentReply } from '@/types/canvas';

interface CommentStore {
  comments: Record<string, Comment>;
  activeCommentId: string | null;
  isAddingComment: boolean;
  pendingCommentPosition: { x: number; y: number } | null;

  // Actions
  setComments: (comments: Record<string, Comment>) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'resolved'>) => string;
  updateComment: (id: string, updates: Partial<Comment>) => void;
  deleteComment: (id: string) => void;
  resolveComment: (id: string) => void;
  unresolveComment: (id: string) => void;

  addReply: (commentId: string, reply: Omit<CommentReply, 'id' | 'createdAt'>) => void;
  deleteReply: (commentId: string, replyId: string) => void;

  setActiveCommentId: (id: string | null) => void;
  setIsAddingComment: (isAdding: boolean) => void;
  setPendingCommentPosition: (position: { x: number; y: number } | null) => void;

  getCommentsByShape: (shapeId: string) => Comment[];
  getUnresolvedComments: () => Comment[];
  getResolvedComments: () => Comment[];
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: {},
  activeCommentId: null,
  isAddingComment: false,
  pendingCommentPosition: null,

  setComments: (comments) => set({ comments }),

  addComment: (commentData) => {
    const id = nanoid();
    const timestamp = Date.now();
    const comment: Comment = {
      ...commentData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      replies: [],
      resolved: false,
    };

    set((state) => ({
      comments: { ...state.comments, [id]: comment },
      isAddingComment: false,
      pendingCommentPosition: null,
      activeCommentId: id,
    }));

    return id;
  },

  updateComment: (id, updates) => {
    set((state) => {
      const comment = state.comments[id];
      if (!comment) return state;

      return {
        comments: {
          ...state.comments,
          [id]: {
            ...comment,
            ...updates,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  deleteComment: (id) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _deleted, ...rest } = state.comments;
      return {
        comments: rest,
        activeCommentId: state.activeCommentId === id ? null : state.activeCommentId,
      };
    });
  },

  resolveComment: (id) => {
    set((state) => {
      const comment = state.comments[id];
      if (!comment) return state;

      return {
        comments: {
          ...state.comments,
          [id]: { ...comment, resolved: true, updatedAt: Date.now() },
        },
      };
    });
  },

  unresolveComment: (id) => {
    set((state) => {
      const comment = state.comments[id];
      if (!comment) return state;

      return {
        comments: {
          ...state.comments,
          [id]: { ...comment, resolved: false, updatedAt: Date.now() },
        },
      };
    });
  },

  addReply: (commentId, replyData) => {
    set((state) => {
      const comment = state.comments[commentId];
      if (!comment) return state;

      const reply: CommentReply = {
        ...replyData,
        id: nanoid(),
        createdAt: Date.now(),
      };

      return {
        comments: {
          ...state.comments,
          [commentId]: {
            ...comment,
            replies: [...comment.replies, reply],
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  deleteReply: (commentId, replyId) => {
    set((state) => {
      const comment = state.comments[commentId];
      if (!comment) return state;

      return {
        comments: {
          ...state.comments,
          [commentId]: {
            ...comment,
            replies: comment.replies.filter((r) => r.id !== replyId),
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  setActiveCommentId: (id) => set({ activeCommentId: id }),
  setIsAddingComment: (isAdding) => set({ isAddingComment: isAdding }),
  setPendingCommentPosition: (position) => set({ pendingCommentPosition: position }),

  getCommentsByShape: (shapeId) => {
    return Object.values(get().comments).filter((c) => c.shapeId === shapeId);
  },

  getUnresolvedComments: () => {
    return Object.values(get().comments).filter((c) => !c.resolved);
  },

  getResolvedComments: () => {
    return Object.values(get().comments).filter((c) => c.resolved);
  },
}));
