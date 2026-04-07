/**
 * React Query Hooks for Results Feature
 * Compatible with existing API structure
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../services/api';

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
  const { apiCall } = useApi();

  return useQuery({
    queryKey: RESULTS_KEYS.list(params),
    queryFn: async () => {
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      const endpoint = `/admin/tests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);

      // Handle both array and object responses
      if (Array.isArray(response)) {
        return {
          data: response,
          pagination: {
            currentPage: params.page || 1,
            totalPages: 1,
            totalItems: response.length,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      return response;
    },
    keepPreviousData: true,
    staleTime: 5000,
  });
};

/**
 * Hook to fetch a single result
 */
export const useResult = (id, options = {}) => {
  const { apiCall } = useApi();

  return useQuery({
    queryKey: RESULTS_KEYS.detail(id),
    queryFn: () => apiCall(`/admin/tests/${id}`),
    enabled: !!id && (options.enabled ?? true),
    ...options,
  });
};

/**
 * Hook to create a new result
 */
export const useCreateResult = (options = {}) => {
  const queryClient = useQueryClient();
  const { apiCall } = useApi();

  return useMutation({
    mutationFn: async (data) => {
      console.log('[useCreateResult] Sending data:', data);
      return await apiCall('/admin/results/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
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

      // Show success message (you can integrate with toast here)
      console.log('Result created successfully');

      options.onSuccess?.(data);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousResults) {
        queryClient.setQueryData(RESULTS_KEYS.lists(), context.previousResults);
      }

      console.error('Failed to create result:', error);

      options.onError?.(error);
    },
  });
};

/**
 * Hook to update a result
 */
export const useUpdateResult = (options = {}) => {
  const queryClient = useQueryClient();
  const { apiCall } = useApi();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      console.log('[useUpdateResult] Updating result:', { id, data });
      return await apiCall(`/admin/results/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
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

      console.log('Result updated successfully');

      options.onSuccess?.(data);
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousResult) {
        queryClient.setQueryData(RESULTS_KEYS.detail(variables.id), context.previousResult);
      }

      console.error('Failed to update result:', error);

      options.onError?.(error);
    },
  });
};

/**
 * Hook to delete a result
 */
export const useDeleteResult = (options = {}) => {
  const queryClient = useQueryClient();
  const { apiCall } = useApi();

  return useMutation({
    mutationFn: async (id) => {
      return await apiCall(`/admin/tests/${id}`, {
        method: 'DELETE',
      });
    },
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

      console.log('Result deleted successfully');

      options.onSuccess?.(data);
    },
    onError: (error, id, context) => {
      // Rollback
      if (context?.previousResults) {
        queryClient.setQueryData(RESULTS_KEYS.lists(), context.previousResults);
      }

      console.error('Failed to delete result:', error);

      options.onError?.(error);
    },
  });
};
