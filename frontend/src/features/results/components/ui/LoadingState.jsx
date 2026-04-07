/**
 * Loading State Component
 * Displays loading skeleton for table
 */

import { Skeleton } from '@/components/ui/skeleton';

export const TableLoadingSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-12 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const LoadingSpinner = ({ size = 'default', text }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    default: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-primary border-t-transparent`}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};
