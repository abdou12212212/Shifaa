/**
 * Results Feature - Main Export
 */

// Pages
export { ResultsPage } from './pages/ResultsPage';

// Hooks
export {
  useResults,
  useResult,
  useCreateResult,
  useUpdateResult,
  useDeleteResult,
  RESULTS_KEYS,
} from './hooks/useResults';

// Components
export { ResultsTable } from './components/ResultsTable';
export { ResultFormModal } from './components/modals/ResultFormModal';
export { FilterModal } from './components/modals/FilterModal';
export { DeleteConfirmDialog } from './components/modals/DeleteConfirmDialog';

// UI Components
export { EmptyState } from './components/ui/EmptyState';
export { ErrorState } from './components/ui/ErrorState';
export { LoadingSpinner, TableLoadingSkeleton } from './components/ui/LoadingState';
export { Pagination } from './components/ui/Pagination';

// API
export * as resultsApi from './lib/api';
