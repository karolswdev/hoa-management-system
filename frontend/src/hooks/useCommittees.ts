import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { CreateCommitteeRequest, UpdateCommitteeRequest, AddCommitteeMemberRequest } from '../types/api';

export const committeeKeys = {
  all: ['committees'] as const,
  lists: () => [...committeeKeys.all, 'list'] as const,
  list: (params?: { includeInactive?: boolean }) => [...committeeKeys.lists(), params] as const,
  details: () => [...committeeKeys.all, 'detail'] as const,
  detail: (id: number) => [...committeeKeys.details(), id] as const,
};

export function useCommittees(includeInactive = false) {
  const query = useQuery({
    queryKey: committeeKeys.list({ includeInactive }),
    queryFn: () => apiService.getCommittees({ includeInactive }),
    staleTime: 60 * 1000,
  });

  return {
    ...query,
    committees: query.data?.committees ?? [],
  };
}

export function useCommittee(id: number, enabled = true) {
  const query = useQuery({
    queryKey: committeeKeys.detail(id),
    queryFn: () => apiService.getCommittee(id),
    staleTime: 60 * 1000,
    enabled: enabled && id > 0,
  });

  return {
    ...query,
    committee: query.data,
  };
}

export function useCreateCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommitteeRequest) => apiService.createCommittee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
    },
  });
}

export function useUpdateCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCommitteeRequest }) =>
      apiService.updateCommittee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
    },
  });
}

export function useDeactivateCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deactivateCommittee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
    },
  });
}

export function useAddCommitteeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, data }: { committeeId: number; data: AddCommitteeMemberRequest }) =>
      apiService.addCommitteeMember(committeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(variables.committeeId) });
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
    },
  });
}

export function useRemoveCommitteeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, userId }: { committeeId: number; userId: number }) =>
      apiService.removeCommitteeMember(committeeId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(variables.committeeId) });
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() });
    },
  });
}
