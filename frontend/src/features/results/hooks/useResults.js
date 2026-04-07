/**
 * React Query Hooks for Results Feature
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchResults,
  fetchResultById,
  createResult,
  updateResult,
  deleteResult,
} from '../lib/api';

// Query keys
export const RESULTS_KEYS = {
  all: ['results'],
  lists: () => [...RESULTS_KEYS.all, 'list'],
  list: (params) => [...RESULTS_KEYS.lists(), params],
  details: () => [...RESULTS_KEYS.all, 'detail'],
  detail: (id) => [...RESULTS_KEYS.details(), id],
};

/**
 * Hook to fetch paginated results
 */
export const useResults = (params = {}) => {
  return useQuery({
    queryKey: RESULTS_KEYS.list(params),
    queryFn: () => fetchResults(params),
    keepPreviousData: true,
    staleTime: 5000,
  });
};

/**
 * Hook to fetch a single result
 */
export const useResult = (id, options = {}) => {
  return useQuery({
    queryKey: RESULTS_KEYS.detail(id),
    queryFn: () => fetchResultById(id),
    enabled: !!id && (options.enabled ?? true),
    ...options,
  });
};

/**
 * Hook to create a new result
 */
export const useCreateResult = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResult,
    onMutate: async (newResult) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: RESULTS_KEYS.lists() });

      // Optimistic update (optional)
      if (options.optimistic) {
        const previousResults = queryClient.getQueryData(RESULTS_KEYS.lists());

        queryClient.setQueryData(RESULTS_KEYS.lists(), (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: [{ id: 'temp-' + Date.now(), ...newResult }, ...old.data],
          };
        });

        return { previousResults };
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: RESULTS_KEYS.lists() });

      toast.success(options.successMessage || 'Result created successfully');

      options.onSuccess?.(data);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousResults) {
        queryClient.setQueryData(RESULTS_KEYS.lists(), context.previousResults);
      }

      toast.error(options.errorMessage || error.message || 'Failed to create result');

      options.onError?.(error);
    },
  });
};

/**
 * Hook to update a result
 */
export const useUpdateResult = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateResult(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: RESULTS_KEYS.detail(id) });

      // Optimistic update
      if (options.optimistic) {
        const previousResult = queryClient.getQueryData(RESULTS_KEYS.detail(id));

        queryClient.setQueryData(RESULTS_KEYS.detail(id), (old) => ({
          ...old,
          ...data,
        }));

        return { previousResult };
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: RESULTS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RESULTS_KEYS.detail(variables.id) });

      toast.success(options.successMessage || 'Result updated successfully');

      options.onSuccess?.(data);
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousResult) {
        queryClient.setQueryData(RESULTS_KEYS.detail(variables.id), context.previousResult);
      }

      toast.error(options.errorMessage || error.message || 'Failed to update result');

      options.onError?.(error);
    },
  });
};

/**
 * Hook to delete a result
 */
export const useDeleteResult = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteResult,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: RESULTS_KEYS.lists() });

      // Optimistic update
      if (options.optimistic) {
        const previousResults = queryClient.getQueryData(RESULTS_KEYS.lists());

        queryClient.setQueryData(RESULTS_KEYS.lists(), (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((item) => item.id !== id),
          };
        });

        return { previousResults };
      }
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: RESULTS_KEYS.lists() });
      queryClient.removeQueries({ queryKey: RESULTS_KEYS.detail(id) });

      toast.success(options.successMessage || 'Result deleted successfully');

      options.onSuccess?.(data);
    },
    onError: (error, id, context) => {
      // Rollback
      if (context?.previousResults) {
        queryClient.setQueryData(RESULTS_KEYS.lists(), context.previousResults);
      }

      toast.error(options.errorMessage || error.message || 'Failed to delete result');

      options.onError?.(error);
    },
  });
};
