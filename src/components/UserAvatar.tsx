/**
 * Renders a user avatar — shows photo if avatar_photo_url is set, otherwise emoji.
 */
interface UserAvatarProps {
  photoUrl?: string | null;
  emoji?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-10 h-10 text-xl',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-20 h-20 text-4xl',
};

export function UserAvatar({ photoUrl, emoji = '🙂', size = 'md', className = '' }: UserAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (photoUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-secondary flex items-center justify-center flex-shrink-0 ${className}`}>
      {emoji}
    </div>
  );
}
