/**
 * Filter Modal Component
 * Allows users to filter results
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, RotateCcw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const sheetVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 200 },
  },
  exit: {
    x: '100%',
    transition: { type: 'spring', damping: 25, stiffness: 200 },
  },
};

export const FilterModal = ({
  open,
  onClose,
  onApply,
  initialFilters = {},
  activeFiltersCount = 0,
}) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterOption1: '',
    filterOption2: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (open) {
      setFilters({
        searchTerm: initialFilters.searchTerm || '',
        filterOption1: initialFilters.filterOption1 || '',
        filterOption2: initialFilters.filterOption2 || '',
        dateFrom: initialFilters.dateFrom || '',
        dateTo: initialFilters.dateTo || '',
      });
    }
  }, [open, initialFilters]);

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      searchTerm: '',
      filterOption1: '',
      filterOption2: '',
      dateFrom: '',
      dateTo: '',
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <AnimatePresence>
        {open && (
          <SheetContent asChild side="right" className="w-full sm:max-w-md">
            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-2xl">
                  <Filter className="h-6 w-6" />
                  Filter Results
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {activeFiltersCount} active
                    </Badge>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Refine your search with the filters below
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Search Term */}
                <div className="space-y-2">
                  <Label htmlFor="searchTerm">Search</Label>
                  <Input
                    id="searchTerm"
                    value={filters.searchTerm}
                    onChange={(e) => handleChange('searchTerm', e.target.value)}
                    placeholder="Search by keyword..."
                  />
                </div>

                {/* Filter Option 1 - Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="filterOption1">Filter Option 1</Label>
                  <Select
                    value={filters.filterOption1}
                    onValueChange={(value) => handleChange('filterOption1', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Option 2 - Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="filterOption2">Filter Option 2</Label>
                  <Select
                    value={filters.filterOption2}
                    onValueChange={(value) => handleChange('filterOption2', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="typeA">Type A</SelectItem>
                      <SelectItem value="typeB">Type B</SelectItem>
                      <SelectItem value="typeC">Type C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-4">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleChange('dateFrom', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleChange('dateTo', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Active Filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {filters.searchTerm && (
                        <Badge variant="secondary">
                          Search: {filters.searchTerm}
                        </Badge>
                      )}
                      {filters.filterOption1 && filters.filterOption1 !== 'all' && (
                        <Badge variant="secondary">
                          Option 1: {filters.filterOption1}
                        </Badge>
                      )}
                      {filters.filterOption2 && filters.filterOption2 !== 'all' && (
                        <Badge variant="secondary">
                          Option 2: {filters.filterOption2}
                        </Badge>
                      )}
                      {filters.dateFrom && (
                        <Badge variant="secondary">From: {filters.dateFrom}</Badge>
                      )}
                      {filters.dateTo && (
                        <Badge variant="secondary">To: {filters.dateTo}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasActiveFilters}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={handleApply} className="gap-2">
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
              </SheetFooter>
            </motion.div>
          </SheetContent>
        )}
      </AnimatePresence>
    </Sheet>
  );
};
