'use client';

import React, { useState, useCallback } from 'react';
import { useCommentStore } from '@/store/commentStore';
import { useUserStore } from '@/store/userStore';
import type { Comment } from '@/types/canvas';

export const CommentsPanel: React.FC = () => {
  const {
    comments,
    activeCommentId,
    setActiveCommentId,
    resolveComment,
    unresolveComment,
    deleteComment,
    addReply,
    setIsAddingComment,
  } = useCommentStore();
  const { currentUser } = useUserStore();
  const [showResolved, setShowResolved] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const commentList = Object.values(comments)
    .filter((c) => (showResolved ? c.resolved : !c.resolved))
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleReply = useCallback(
    (commentId: string) => {
      const text = replyText[commentId]?.trim();
      if (!text || !currentUser) return;

      addReply(commentId, {
        text,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userColor: currentUser.color,
      });

      setReplyText((prev) => ({ ...prev, [commentId]: '' }));
    },
    [replyText, currentUser, addReply]
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col border-t border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CommentIcon className="w-4 h-4" />
          Comments
          {commentList.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {commentList.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setIsAddingComment(true)}
          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Add comment"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex p-2 gap-1 border-b border-gray-200">
        <button
          onClick={() => setShowResolved(false)}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            !showResolved
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            showResolved
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Resolved
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {commentList.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {showResolved ? 'No resolved comments' : 'No open comments'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {commentList.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isActive={activeCommentId === comment.id}
                onSelect={() => setActiveCommentId(comment.id)}
                onResolve={() => resolveComment(comment.id)}
                onUnresolve={() => unresolveComment(comment.id)}
                onDelete={() => deleteComment(comment.id)}
                replyText={replyText[comment.id] || ''}
                onReplyTextChange={(text) =>
                  setReplyText((prev) => ({ ...prev, [comment.id]: text }))
                }
                onSubmitReply={() => handleReply(comment.id)}
                formatTime={formatTime}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  isActive: boolean;
  onSelect: () => void;
  onResolve: () => void;
  onUnresolve: () => void;
  onDelete: () => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: () => void;
  formatTime: (timestamp: number) => string;
  currentUserId?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isActive,
  onSelect,
  onResolve,
  onUnresolve,
  onDelete,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  formatTime,
  currentUserId,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const isOwner = currentUserId === comment.userId;

  return (
    <div
      className={`p-3 cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      {/* Comment header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: comment.userColor }}
          >
            {comment.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
            <span className="text-xs text-gray-500 ml-2">{formatTime(comment.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {comment.resolved ? (
            <button
              onClick={onUnresolve}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Reopen"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onResolve}
              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded"
              title="Resolve"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
          )}
          {isOwner && (
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comment text */}
      <p className="mt-2 text-sm text-gray-700">{comment.text}</p>

      {/* Replies section */}
      {comment.replies.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowReplies(!showReplies);
          }}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
        >
          {showReplies ? 'Hide' : 'Show'} {comment.replies.length} repl
          {comment.replies.length === 1 ? 'y' : 'ies'}
        </button>
      )}

      {showReplies && (
        <div className="mt-2 pl-4 border-l-2 border-gray-200 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: reply.userColor }}
                >
                  {reply.userName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{reply.userName}</span>
                <span className="text-xs text-gray-500">{formatTime(reply.createdAt)}</span>
              </div>
              <p className="mt-1 text-gray-700">{reply.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {isActive && !comment.resolved && (
        <div
          className="mt-3 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            placeholder="Reply..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmitReply();
              }
            }}
          />
          <button
            onClick={onSubmitReply}
            disabled={!replyText.trim()}
            className={`px-3 py-1 text-sm rounded ${
              replyText.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
};

// Icons
const CommentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default CommentsPanel;
