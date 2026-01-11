import { useCommentStore } from '@/store/commentStore';

describe('commentStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useCommentStore.setState({
      comments: {},
      activeCommentId: null,
      isAddingComment: false,
      pendingCommentPosition: null,
    });
  });

  describe('comment management', () => {
    it('should add a comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Test comment',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
      });

      expect(commentId).toBeDefined();
      const comments = useCommentStore.getState().comments;
      expect(comments[commentId]).toBeDefined();
      expect(comments[commentId].text).toBe('Test comment');
      expect(comments[commentId].x).toBe(100);
      expect(comments[commentId].y).toBe(200);
      expect(comments[commentId].resolved).toBe(false);
      expect(comments[commentId].replies).toEqual([]);
    });

    it('should update a comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Original text',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
      });

      useCommentStore.getState().updateComment(commentId, {
        text: 'Updated text',
        x: 150,
      });

      const comment = useCommentStore.getState().comments[commentId];
      expect(comment.text).toBe('Updated text');
      expect(comment.x).toBe(150);
      expect(comment.y).toBe(200); // Unchanged
    });

    it('should delete a comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'To be deleted',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
      });

      expect(useCommentStore.getState().comments[commentId]).toBeDefined();

      useCommentStore.getState().deleteComment(commentId);

      expect(useCommentStore.getState().comments[commentId]).toBeUndefined();
    });

    it('should clear activeCommentId when deleting active comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Active comment',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
      });

      useCommentStore.getState().setActiveCommentId(commentId);
      expect(useCommentStore.getState().activeCommentId).toBe(commentId);

      useCommentStore.getState().deleteComment(commentId);
      expect(useCommentStore.getState().activeCommentId).toBeNull();
    });
  });

  describe('comment resolution', () => {
    it('should resolve a comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Test comment',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
      });

      expect(useCommentStore.getState().comments[commentId].resolved).toBe(false);

      useCommentStore.getState().resolveComment(commentId);

      expect(useCommentStore.getState().comments[commentId].resolved).toBe(true);
    });

    it('should unresolve a comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Test comment',
        userId: 'user-1',
        userName: 'Test User',
        userColor: '#FF0000',
      });

      useCommentStore.getState().resolveComment(commentId);
      expect(useCommentStore.getState().comments[commentId].resolved).toBe(true);

      useCommentStore.getState().unresolveComment(commentId);
      expect(useCommentStore.getState().comments[commentId].resolved).toBe(false);
    });
  });

  describe('replies', () => {
    it('should add a reply to a comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Parent comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      useCommentStore.getState().addReply(commentId, {
        text: 'Reply text',
        userId: 'user-2',
        userName: 'User 2',
        userColor: '#00FF00',
      });

      const comment = useCommentStore.getState().comments[commentId];
      expect(comment.replies).toHaveLength(1);
      expect(comment.replies[0].text).toBe('Reply text');
      expect(comment.replies[0].userName).toBe('User 2');
    });

    it('should add multiple replies', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Parent comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      useCommentStore.getState().addReply(commentId, {
        text: 'Reply 1',
        userId: 'user-2',
        userName: 'User 2',
        userColor: '#00FF00',
      });

      useCommentStore.getState().addReply(commentId, {
        text: 'Reply 2',
        userId: 'user-3',
        userName: 'User 3',
        userColor: '#0000FF',
      });

      const comment = useCommentStore.getState().comments[commentId];
      expect(comment.replies).toHaveLength(2);
    });

    it('should delete a reply', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Parent comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      useCommentStore.getState().addReply(commentId, {
        text: 'Reply to delete',
        userId: 'user-2',
        userName: 'User 2',
        userColor: '#00FF00',
      });

      const replyId = useCommentStore.getState().comments[commentId].replies[0].id;

      useCommentStore.getState().deleteReply(commentId, replyId);

      expect(useCommentStore.getState().comments[commentId].replies).toHaveLength(0);
    });
  });

  describe('filtering', () => {
    it('should get comments by shape', () => {
      useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Comment on shape 1',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
        shapeId: 'shape-1',
      });

      useCommentStore.getState().addComment({
        x: 150,
        y: 250,
        text: 'Another comment on shape 1',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
        shapeId: 'shape-1',
      });

      useCommentStore.getState().addComment({
        x: 200,
        y: 300,
        text: 'Comment on shape 2',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
        shapeId: 'shape-2',
      });

      const shape1Comments = useCommentStore.getState().getCommentsByShape('shape-1');
      expect(shape1Comments).toHaveLength(2);

      const shape2Comments = useCommentStore.getState().getCommentsByShape('shape-2');
      expect(shape2Comments).toHaveLength(1);
    });

    it('should get unresolved comments', () => {
      const id1 = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Open comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      const id2 = useCommentStore.getState().addComment({
        x: 150,
        y: 250,
        text: 'Will be resolved',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      useCommentStore.getState().resolveComment(id2);

      const unresolvedComments = useCommentStore.getState().getUnresolvedComments();
      expect(unresolvedComments).toHaveLength(1);
      expect(unresolvedComments[0].id).toBe(id1);
    });

    it('should get resolved comments', () => {
      useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Open comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      const id2 = useCommentStore.getState().addComment({
        x: 150,
        y: 250,
        text: 'Resolved comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      useCommentStore.getState().resolveComment(id2);

      const resolvedComments = useCommentStore.getState().getResolvedComments();
      expect(resolvedComments).toHaveLength(1);
      expect(resolvedComments[0].id).toBe(id2);
    });
  });

  describe('UI state', () => {
    it('should set active comment', () => {
      const commentId = useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'Test comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      useCommentStore.getState().setActiveCommentId(commentId);
      expect(useCommentStore.getState().activeCommentId).toBe(commentId);

      useCommentStore.getState().setActiveCommentId(null);
      expect(useCommentStore.getState().activeCommentId).toBeNull();
    });

    it('should toggle adding comment mode', () => {
      expect(useCommentStore.getState().isAddingComment).toBe(false);

      useCommentStore.getState().setIsAddingComment(true);
      expect(useCommentStore.getState().isAddingComment).toBe(true);

      useCommentStore.getState().setIsAddingComment(false);
      expect(useCommentStore.getState().isAddingComment).toBe(false);
    });

    it('should set pending comment position', () => {
      useCommentStore.getState().setPendingCommentPosition({ x: 100, y: 200 });
      expect(useCommentStore.getState().pendingCommentPosition).toEqual({ x: 100, y: 200 });

      useCommentStore.getState().setPendingCommentPosition(null);
      expect(useCommentStore.getState().pendingCommentPosition).toBeNull();
    });

    it('should reset UI state when adding comment', () => {
      useCommentStore.getState().setIsAddingComment(true);
      useCommentStore.getState().setPendingCommentPosition({ x: 100, y: 200 });

      useCommentStore.getState().addComment({
        x: 100,
        y: 200,
        text: 'New comment',
        userId: 'user-1',
        userName: 'User 1',
        userColor: '#FF0000',
      });

      expect(useCommentStore.getState().isAddingComment).toBe(false);
      expect(useCommentStore.getState().pendingCommentPosition).toBeNull();
    });
  });
});
