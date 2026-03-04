import { useNavigate } from 'react-router-dom';

interface TappableAvatarProps {
  userId: string;
  emoji: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Wraps an avatar emoji so tapping it navigates to that user's public profile.
 * Stops event propagation to prevent parent onClick handlers from firing.
 */
export function TappableAvatar({ userId, emoji, className = '', children }: TappableAvatarProps) {
  const navigate = useNavigate();

  // Don't link to self (currentUser = u1) – that goes to /profile
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId === 'u1') {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  if (children) {
    return (
      <button onClick={handleClick} className={className}>
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`cursor-pointer active:scale-90 transition-transform ${className}`}
    >
      {emoji}
    </button>
  );
}
