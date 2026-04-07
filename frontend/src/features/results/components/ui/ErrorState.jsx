/**
 * Error State Component
 * Displays error messages with retry option
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data',
  onRetry,
  retryLabel = 'Try Again'
}) => {
  return (
    <div className="py-8 px-4">
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="ml-2">{title}</AlertTitle>
        <AlertDescription className="ml-2 mt-2">
          {message}
        </AlertDescription>
        {onRetry && (
          <div className="mt-4 ml-2">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {retryLabel}
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};
