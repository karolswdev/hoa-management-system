import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { WorkflowTransitionRequest, WorkflowCommentRequest } from '../types/api';

export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (params?: { status?: string; page?: number; limit?: number }) => [...workflowKeys.lists(), params] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: number) => [...workflowKeys.details(), id] as const,
};

export function useWorkflows(params?: { status?: string; page?: number; limit?: number }) {
  const query = useQuery({
    queryKey: workflowKeys.list(params),
    queryFn: () => apiService.getWorkflows(params),
    staleTime: 30 * 1000,
  });

  return {
    ...query,
    workflows: query.data?.workflows ?? [],
    pagination: query.data?.pagination,
  };
}

export function useWorkflow(id: number, enabled = true) {
  const query = useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => apiService.getWorkflow(id),
    staleTime: 30 * 1000,
    enabled: enabled && id > 0,
  });

  return {
    ...query,
    workflow: query.data?.workflow ?? query.data,
  };
}

export function usePerformTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, data }: { workflowId: number; data: WorkflowTransitionRequest }) =>
      apiService.performTransition(workflowId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['arc-requests'] });
    },
  });
}

export function useAddWorkflowComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, data }: { workflowId: number; data: WorkflowCommentRequest }) =>
      apiService.addWorkflowComment(workflowId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) });
    },
  });
}

export function useUploadWorkflowAttachments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, files }: { workflowId: number; files: File[] }) =>
      apiService.uploadWorkflowAttachments(workflowId, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) });
    },
  });
}
