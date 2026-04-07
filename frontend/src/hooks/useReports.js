/**
 * React Query Hooks for Reports and Analytics
 */

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../services/api';

// Query keys
export const REPORTS_KEYS = {
  all: ['reports'],
  dashboard: (period) => [...REPORTS_KEYS.all, 'dashboard', period],
  financial: (params) => [...REPORTS_KEYS.all, 'financial', params],
  patients: () => [...REPORTS_KEYS.all, 'patients'],
};

/**
 * Hook to fetch dashboard reports
 * @param {string} period - 'week', 'month', or 'year'
 */
export const useDashboardReports = (period = 'month') => {
  const { apiCall } = useApi();

  return useQuery({
    queryKey: REPORTS_KEYS.dashboard(period),
    queryFn: async () => {
      const response = await apiCall(`/admin/reports/dashboard?period=${period}`);
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch financial reports
 * @param {Object} params - { startDate, endDate }
 */
export const useFinancialReport = (params = {}) => {
  const { apiCall } = useApi();

  return useQuery({
    queryKey: REPORTS_KEYS.financial(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const endpoint = `/admin/reports/financial${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      return response;
    },
    enabled: !!(params.startDate && params.endDate),
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to fetch patient analytics
 */
export const usePatientAnalytics = () => {
  const { apiCall } = useApi();

  return useQuery({
    queryKey: REPORTS_KEYS.patients(),
    queryFn: async () => {
      const response = await apiCall('/admin/reports/patients');
      return response;
    },
    staleTime: 60000, // 1 minute
  });
};
