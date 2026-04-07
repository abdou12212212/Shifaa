/**
 * Results Page - Main Container
 * Orchestrates all state, modals, and interactions
 */

import { useState, useMemo } from 'react';
import { Plus, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Hooks
import {
  useResults,
  useCreateResult,
  useUpdateResult,
  useDeleteResult,
} from '../hooks/useResults';

// Components
import { ResultsTable } from '../components/ResultsTable';
import { ResultFormModal } from '../components/modals/ResultFormModal';
import { FilterModal } from '../components/modals/FilterModal';
import { DeleteConfirmDialog } from '../components/modals/DeleteConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { TableLoadingSkeleton, LoadingSpinner } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

export const ResultsPage = () => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Filter State
  const [filters, setFilters] = useState({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected Items State
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  // Build query params
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      ...filters,
    }),
    [currentPage, pageSize, filters]
  );

  // Queries
  const {
    data: resultsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useResults(queryParams);

  // Mutations
  const createMutation = useCreateResult({
    onSuccess: () => {
      setIsAddModalOpen(false);
      // If we're not on page 1, go back to page 1 to see new item
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    },
  });

  const updateMutation = useUpdateResult({
    onSuccess: () => {
      setIsEditModalOpen(false);
      setSelectedItem(null);
    },
  });

  const deleteMutation = useDeleteResult({
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      // If current page becomes empty after delete, go to previous page
      if (resultsData?.data?.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
  });

  // Extract data from response
  const results = resultsData?.data || [];
  const totalPages = resultsData?.pagination?.totalPages || 1;
  const totalItems = resultsData?.pagination?.totalItems || 0;

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== '' && value !== null).length;
  }, [filters]);

  // Table Column Configuration
  const columns = [
    {
      key: 'field1',
      label: 'Field 1',
      render: (item) => <span className="font-medium">{item.field1}</span>,
    },
    {
      key: 'field2',
      label: 'Field 2',
      render: (item) => item.field2,
    },
    {
      key: 'field3',
      label: 'Field 3',
      render: (item) => (
        <Badge variant={item.field3 === 'option1' ? 'default' : 'secondary'}>
          {item.field3 || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'field4',
      label: 'Field 4',
      render: (item) => item.field4,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item) => {
        if (!item.createdAt) return 'N/A';
        return new Date(item.createdAt).toLocaleDateString();
      },
    },
  ];

  // Handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleUpdateSubmit = ({ id, data }) => {
    updateMutation.mutate({ id, data });
  };

  const handleDeleteConfirm = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem.id);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    // Export logic here
    console.log('Exporting data...');
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>Loading results...</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TableLoadingSkeleton rows={5} columns={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <ErrorState
              message={error?.message || 'Failed to load results'}
              onRetry={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your results in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Across all pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPage} / {totalPages}
            </div>
            <p className="text-xs text-muted-foreground">{results.length} items shown</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFiltersCount}</div>
            <p className="text-xs text-muted-foreground">
              {activeFiltersCount > 0 ? 'Filters applied' : 'No filters active'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Results</CardTitle>
              <CardDescription>
                View and manage your results. {isFetching && 'Updating...'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterModalOpen(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button onClick={handleAddClick} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {results.length === 0 ? (
            <EmptyState
              title={activeFiltersCount > 0 ? 'No results match your filters' : 'No results yet'}
              description={
                activeFiltersCount > 0
                  ? 'Try adjusting your filters or clear them to see all results'
                  : 'Get started by adding your first result'
              }
              action={activeFiltersCount > 0 ? undefined : handleAddClick}
              actionLabel="Add First Result"
            />
          ) : (
            <>
              <ResultsTable
                data={results}
                columns={columns}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                selectable
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                isLoading={isFetching}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isFetching}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ResultFormModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isLoading}
        mode="create"
      />

      <ResultFormModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleUpdateSubmit}
        initialData={selectedItem}
        isLoading={updateMutation.isLoading}
        mode="edit"
      />

      <FilterModal
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        activeFiltersCount={activeFiltersCount}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isLoading}
        itemName={selectedItem?.field1}
      />
    </div>
  );
};

export default ResultsPage;
