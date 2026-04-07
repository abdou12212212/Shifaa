/**
 * Empty State Component
 * Displays when no results are found
 */

import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyState = ({
  title = 'No results found',
  description = 'Try adjusting your filters or add a new result',
  icon: Icon = FileQuestion,
  action,
  actionLabel = 'Add New'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <Button onClick={action} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
