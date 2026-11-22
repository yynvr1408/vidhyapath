import React from 'react';
import { LearnerProfile } from '../types';

interface StudentAvatarProps {
  learner?: LearnerProfile | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showCodeBadge?: boolean;
}

export const getStudentInitials = (name?: string): string => {
  if (!name) return 'S';
  const clean = name.trim().split(/\s+/);
  if (clean.length === 1) {
    return clean[0].substring(0, 2).toUpperCase();
  }
  return (clean[0][0] + clean[clean.length - 1][0]).toUpperCase();
};

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  learner,
  size = 'md',
  className = '',
}) => {
  if (!learner) {
    return (
      <div className={`w-10 h-10 rounded-full bg-[#DCFCE7] border border-[#D1E7DD] text-[#15803D] flex items-center justify-center text-sm ${className}`}>
        👤
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl',
  };

  const ringColor = learner.avatarColor || '#15803D';

  // 1. Photo Avatar
  if (learner.avatarType === 'photo' && learner.avatarPhoto) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 border-2 shadow-sm relative ${sizeClasses[size]} ${className}`}
        style={{ borderColor: ringColor }}
      >
        <img
          src={learner.avatarPhoto}
          alt={learner.nickname}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // 2. Initials Avatar
  if (learner.avatarType === 'initials') {
    const initials = getStudentInitials(learner.nickname);
    return (
      <div
        className={`rounded-full flex items-center justify-center font-black text-white shrink-0 border-2 border-white shadow-md tracking-wider ${sizeClasses[size]} ${className}`}
        style={{ backgroundColor: ringColor }}
      >
        <span>{initials}</span>
      </div>
    );
  }

  // 3. Icon / Emoji Preset Avatar (Default)
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-md ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: ringColor }}
    >
      <span>{learner.avatarEmoji || '🧑‍🎓'}</span>
    </div>
  );
};
