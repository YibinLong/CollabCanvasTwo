'use client';

import React from 'react';
import { useUserStore } from '@/store/userStore';

export const PresencePanel: React.FC = () => {
  const { currentUser, onlineUsers, connectionStatus } = useUserStore();

  const allUsers = Object.values(onlineUsers);

  return (
    <div className="flex items-center gap-2">
      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-green-500'
              : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-red-500'
          }`}
        />
        <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-gray-300" />

      {/* Online users */}
      <div className="flex items-center -space-x-2">
        {currentUser && (
          <UserAvatar
            name={currentUser.displayName}
            color={currentUser.color}
            isCurrentUser
          />
        )}
        {allUsers
          .filter((user) => user.id !== currentUser?.id)
          .slice(0, 5)
          .map((user) => (
            <UserAvatar
              key={user.id}
              name={user.displayName}
              color={user.color}
            />
          ))}
        {allUsers.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              +{allUsers.length - 5}
            </span>
          </div>
        )}
      </div>

      {/* User count */}
      <span className="text-xs text-gray-500">
        {allUsers.length + (currentUser ? 1 : 0)} online
      </span>
    </div>
  );
};

interface UserAvatarProps {
  name: string;
  color: string;
  isCurrentUser?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, color, isCurrentUser }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        w-8 h-8 rounded-full flex items-center justify-center
        border-2 border-white text-white text-xs font-medium
        cursor-default transition-transform hover:scale-110 hover:z-10
        ${isCurrentUser ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
      `}
      style={{ backgroundColor: color }}
      title={`${name}${isCurrentUser ? ' (you)' : ''}`}
    >
      {initials}
    </div>
  );
};
