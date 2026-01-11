'use client';

import React from 'react';
import { useUserStore } from '@/store/userStore';

export const PresencePanel: React.FC = () => {
  const { currentUser, onlineUsers, connectionStatus } = useUserStore();

  const allUsers = Object.values(onlineUsers);

  return (
    <div className="border-t border-gray-200 p-3 bg-gray-50">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase">Online</h4>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'syncing'
                  ? 'bg-blue-500 animate-pulse'
                  : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-400 capitalize">
            {connectionStatus === 'syncing' ? 'Syncing...' : connectionStatus}
          </span>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {/* Current user first */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={currentUser.displayName}
              color={currentUser.color}
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 truncate block">
                {currentUser.displayName}
              </span>
              <span className="text-xs text-gray-400">(you)</span>
            </div>
            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Online" />
          </div>
        )}

        {/* Other online users */}
        {allUsers
          .filter((user) => user.id !== currentUser?.id && user.isOnline)
          .map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <UserAvatar
                name={user.displayName}
                color={user.color}
              />
              <span className="text-sm text-gray-700 truncate flex-1">
                {user.displayName}
              </span>
              <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Online" />
            </div>
          ))}

        {allUsers.filter((u) => u.id !== currentUser?.id && u.isOnline).length === 0 && (
          <p className="text-xs text-gray-400 text-center py-1">No other users online</p>
        )}
      </div>

      {/* Compact avatar row for header (alternative view) */}
      <div className="hidden mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center -space-x-2">
          {currentUser && (
            <UserAvatar
              name={currentUser.displayName}
              color={currentUser.color}
              small
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
                small
              />
            ))}
          {allUsers.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{allUsers.length - 5}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UserAvatarProps {
  name: string;
  color: string;
  small?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, color, small }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = small ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-xs';

  return (
    <div
      className={`
        ${sizeClasses} rounded-full flex items-center justify-center
        text-white font-medium flex-shrink-0
        ${small ? 'border-2 border-white' : ''}
      `}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials || '?'}
    </div>
  );
};
