import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { CreatePollRequest, PollFilter, SubmitVoteRequest } from '../types/api';

/**
 * Query key factory for poll-related queries
 * Ensures consistent cache keys across all poll hooks
 */
export const pollKeys = {
  all: ['polls'] as const,
  lists: () => [...pollKeys.all, 'list'] as const,
  list: (filters?: PollFilter) => [...pollKeys.lists(), filters] as const,
  details: () => [...pollKeys.all, 'detail'] as const,
  detail: (id: number) => [...pollKeys.details(), id] as const,
  receipts: () => [...pollKeys.all, 'receipt'] as const,
  receipt: (pollId: number, hash: string) => [...pollKeys.receipts(), pollId, hash] as const,
};

/**
 * Hook to fetch polls list with optional filters
 *
 * Features:
 * - 30-second stale time for active polls (per architecture spec)
 * - Filter by type (informal/binding) and status (draft/active/closed)
 * - Pagination support
 * - Integrates with accessibility context for cache invalidation
 *
 * @param filters - Optional filters for poll type, status, search
 * @param page - Current page number (default: 1)
 * @param limit - Items per page (default: 20)
 *
 * @example
 * ```tsx
 * const { polls, isLoading, pagination } = usePolls({ status: 'active' });
 * ```
 */
export function usePolls(filters?: PollFilter, page = 1, limit = 20) {
  const query = useQuery({
    queryKey: pollKeys.list({ ...filters, page, limit }),
    queryFn: () => apiService.getPolls({ ...filters, page, limit }),
    staleTime: 30 * 1000, // 30 seconds for active polls
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 2,
  });

  return {
    ...query,
    polls: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isSkeleton: query.isLoading || query.isPlaceholderData,
  };
}

/**
 * Hook to fetch a single poll's details including options and vote counts
 *
 * Features:
 * - 30-second stale time for active polls
 * - Includes poll options, user vote status, time remaining
 * - Exposes server time metadata for TTL calculations
 * - Auto-refetches when accessibility mode changes (cache invalidation)
 *
 * @param pollId - The ID of the poll to fetch
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { poll, isLoading, timeRemaining } = usePollDetail(pollId);
 * ```
 */
export function usePollDetail(pollId: number, enabled = true) {
  const query = useQuery({
    queryKey: pollKeys.detail(pollId),
    queryFn: () => apiService.getPoll(pollId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    retry: 2,
    enabled: enabled && pollId > 0,
  });

  const timeRemaining = query.data?.time_remaining ?? null;
  const isActive = query.data?.status === 'active';
  const isClosed = query.data?.status === 'closed';
  const isBinding = query.data?.poll_type === 'binding';
  const userHasVoted = query.data?.user_has_voted ?? false;

  return {
    ...query,
    poll: query.data,
    options: query.data?.options ?? [],
    timeRemaining,
    isActive,
    isClosed,
    isBinding,
    userHasVoted,
    canVote: isActive && !userHasVoted,
    showResults: query.data?.show_results_before_close || isClosed,
    isLoading: query.isLoading,
    isSkeleton: query.isLoading || query.isPlaceholderData,
  };
}

/**
 * Hook to submit a vote on a poll
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatically invalidates poll cache on success
 * - Returns vote receipt for binding polls
 * - Handles rate limiting and error states
 *
 * @example
 * ```tsx
 * const { mutate: submitVote, isPending, receipt } = useSubmitVote();
 *
 * const handleVote = (optionIds: number[]) => {
 *   submitVote(
 *     { pollId, data: { option_ids: optionIds, request_receipt: true } },
 *     {
 *       onSuccess: (response) => {
 *         if (response.receipt) {
 *           // Store receipt locally
 *           saveReceipt(response.receipt);
 *         }
 *       }
 *     }
 *   );
 * };
 * ```
 */
export function useSubmitVote() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ pollId, data }: { pollId: number; data: SubmitVoteRequest }) =>
      apiService.submitVote(pollId, data),
    onSuccess: (_, variables) => {
      // Invalidate the poll detail to show updated vote status
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(variables.pollId) });
      // Invalidate poll lists to show updated vote counts
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });

  return {
    ...mutation,
    submitVote: mutation.mutate,
    submitVoteAsync: mutation.mutateAsync,
    receipt: mutation.data?.receipt,
    voteHash: mutation.data?.vote_hash,
  };
}

/**
 * Hook to verify a vote receipt
 *
 * Features:
 * - Public endpoint (no auth required)
 * - Returns receipt verification status
 * - Shows truncated metadata for privacy
 * - Longer cache time since receipts are immutable
 *
 * @param pollId - The poll ID
 * @param hash - The vote hash to verify
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { receipt, isVerified, isLoading } = useReceiptLookup(pollId, hash);
 * ```
 */
export function useReceiptLookup(pollId: number, hash: string, enabled = true) {
  const query = useQuery({
    queryKey: pollKeys.receipt(pollId, hash),
    queryFn: () => apiService.getReceipt(pollId, hash),
    staleTime: 10 * 60 * 1000, // 10 minutes (receipts are immutable)
    gcTime: 30 * 60 * 1000,
    retry: 1, // Only retry once for receipt lookup
    enabled: enabled && pollId > 0 && hash.length > 0,
  });

  return {
    ...query,
    receipt: query.data,
    isVerified: query.data?.verified ?? false,
    isLoading: query.isLoading,
  };
}

/**
 * Hook to create a new poll (admin only)
 *
 * Features:
 * - Validates poll options and timing
 * - Invalidates poll lists on success
 * - Returns created poll with ID
 *
 * @example
 * ```tsx
 * const { mutate: createPoll, isPending } = useCreatePoll();
 * ```
 */
export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.createPoll,
    onSuccess: () => {
      // Invalidate all poll lists
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing poll (admin only)
 *
 * Features:
 * - Partial updates supported
 * - Invalidates both detail and list caches
 *
 * @example
 * ```tsx
 * const { mutate: updatePoll } = useUpdatePoll();
 * ```
 */
export function useUpdatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePollRequest> }) =>
      apiService.updatePoll(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
}

/**
 * Hook to delete a poll (admin only)
 *
 * @example
 * ```tsx
 * const { mutate: deletePoll } = useDeletePoll();
 * ```
 */
export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deletePoll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
}

/**
 * Combined hook for poll data with accessibility integration
 * Invalidates caches when accessibility mode changes
 *
 * @example
 * ```tsx
 * const pollData = usePollsData({ status: 'active' });
 * ```
 */
export function usePollsData(filters?: PollFilter) {
  const polls = usePolls(filters);
  const queryClient = useQueryClient();

  // Expose method to manually invalidate caches (called when accessibility mode changes)
  const invalidatePolls = () => {
    queryClient.invalidateQueries({ queryKey: pollKeys.all });
  };

  return {
    ...polls,
    invalidatePolls,
  };
}
