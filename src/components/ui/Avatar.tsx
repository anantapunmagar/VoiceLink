import { cn } from '../../utils/cn';
import type { User } from '../../lib/types';

interface AvatarProps {
  user?: Pick<User, 'username' | 'avatar' | 'status'> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: User['status'];
  className?: string;
  onClick?: () => void;
}

const sizes = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};
const dotSizes = {
  xs: 'h-2 w-2 border',
  sm: 'h-2.5 w-2.5 border-[1.5px]',
  md: 'h-3 w-3 border-2',
  lg: 'h-3.5 w-3.5 border-2',
  xl: 'h-4 w-4 border-2',
};
const statusColors = {
  online: 'bg-[color:var(--color-success)]',
  idle: 'bg-[color:var(--color-warn)]',
  dnd: 'bg-[color:var(--color-danger)]',
  offline: 'bg-[color:var(--color-text-mute)]',
};

const palette = [
  '#5865f2',
  '#eb459e',
  '#ed4245',
  '#faa61a',
  '#3ba55d',
  '#00b0f4',
  '#7289da',
  '#9c84ec',
];

export function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ user, size = 'md', showStatus, status, className, onClick }: AvatarProps) {
  const name = user?.username ?? '?';
  const bg = user?.avatar ? 'transparent' : colorForName(name);
  const st = status ?? user?.status ?? 'offline';

  return (
    <div
      className={cn('relative flex-shrink-0', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold overflow-hidden select-none ring-0 transition-all',
          sizes[size]
        )}
        style={{ background: bg }}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span style={{ color: '#fff', fontSize: '0.9em' }}>{initials(name)}</span>
        )}
      </div>
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-[color:var(--color-bg-2)]',
            dotSizes[size],
            statusColors[st],
            st === 'online' && 'pulse-dot'
          )}
        />
      )}
    </div>
  );
}
