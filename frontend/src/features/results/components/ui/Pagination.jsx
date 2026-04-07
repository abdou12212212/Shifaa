/**
 * Pagination Component
 * Handles next/previous navigation
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  showPageInfo = true,
}) => {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (hasPrevious && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {showPageInfo && (
        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevious || isLoading}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext || isLoading}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
