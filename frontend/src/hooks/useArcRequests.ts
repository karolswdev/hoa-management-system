import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { CreateArcRequestRequest, UpdateArcRequestRequest } from '../types/api';
import { workflowKeys } from './useWorkflows';

export const arcRequestKeys = {
  all: ['arc-requests'] as const,
  lists: () => [...arcRequestKeys.all, 'list'] as const,
  list: (params?: { status?: string; page?: number; limit?: number }) => [...arcRequestKeys.lists(), params] as const,
  details: () => [...arcRequestKeys.all, 'detail'] as const,
  detail: (id: number) => [...arcRequestKeys.details(), id] as const,
};

export const arcCategoryKeys = {
  all: ['arc-categories'] as const,
  lists: () => [...arcCategoryKeys.all, 'list'] as const,
  list: (params?: { includeInactive?: boolean }) => [...arcCategoryKeys.lists(), params] as const,
};

export function useArcRequests(params?: { status?: string; page?: number; limit?: number }) {
  const query = useQuery({
    queryKey: arcRequestKeys.list(params),
    queryFn: () => apiService.getArcRequests(params),
    staleTime: 30 * 1000,
  });

  return {
    ...query,
    arcRequests: query.data?.arcRequests ?? [],
    pagination: query.data?.pagination,
  };
}

export function useArcRequest(id: number, enabled = true) {
  const query = useQuery({
    queryKey: arcRequestKeys.detail(id),
    queryFn: () => apiService.getArcRequest(id),
    staleTime: 30 * 1000,
    enabled: enabled && id > 0,
  });

  return {
    ...query,
    arcRequest: query.data?.arcRequest,
    detailWorkflow: query.data?.workflow,
  };
}

export function useCreateArcRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArcRequestRequest) => apiService.createArcRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arcRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useUpdateArcRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateArcRequestRequest }) =>
      apiService.updateArcRequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: arcRequestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: arcRequestKeys.lists() });
    },
  });
}

export function useArcCategories(includeInactive = false) {
  const query = useQuery({
    queryKey: arcCategoryKeys.list({ includeInactive }),
    queryFn: () => apiService.getArcCategories({ includeInactive }),
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    categories: query.data?.categories ?? [],
  };
}

export function useCreateArcCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.createArcCategory.bind(apiService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arcCategoryKeys.lists() });
    },
  });
}

export function useUpdateArcCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof apiService.updateArcCategory>[1] }) =>
      apiService.updateArcCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arcCategoryKeys.lists() });
    },
  });
}

export function useDeactivateArcCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deactivateArcCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arcCategoryKeys.lists() });
    },
  });
}
