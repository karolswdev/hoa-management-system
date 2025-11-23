import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { BoardContactRequest } from '../types/api';

/**
 * Query key factory for board-related queries
 * Ensures consistent cache keys across all board hooks
 */
export const boardKeys = {
  all: ['board'] as const,
  roster: () => [...boardKeys.all, 'roster'] as const,
  history: (page?: number, limit?: number) =>
    [...boardKeys.all, 'history', { page, limit }] as const,
  config: () => [...boardKeys.all, 'config'] as const,
};

/**
 * Hook to fetch board roster data with React Query
 *
 * Features:
 * - 5-minute stale time (per architecture spec)
 * - Exposes TTL metadata (lastFetched timestamp)
 * - Returns high-level states for skeleton/visibility logic
 *
 * @example
 * ```tsx
 * const { data, isLoading, isSkeleton, lastFetched } = useBoardRoster();
 * ```
 */
export function useBoardRoster() {
  const query = useQuery({
    queryKey: boardKeys.roster(),
    queryFn: () => apiService.getBoardRoster(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
  });

  return {
    ...query,
    members: query.data?.members ?? [],
    lastFetched: query.data?.lastFetched,
    isSkeleton: query.isLoading || query.isPlaceholderData,
  };
}

/**
 * Hook to fetch board history with pagination
 *
 * Features:
 * - Member-only data (caller must handle auth guards)
 * - Paginated results with React Query
 * - 5-minute stale time
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 *
 * @example
 * ```tsx
 * const { data, isLoading, pagination } = useBoardHistory(1, 10);
 * ```
 */
export function useBoardHistory(page = 1, limit = 10) {
  const query = useQuery({
    queryKey: boardKeys.history(page, limit),
    queryFn: () => apiService.getBoardHistory({ page, limit }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  return {
    ...query,
    historyItems: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isSkeleton: query.isLoading || query.isPlaceholderData,
  };
}

/**
 * Hook to fetch board configuration (visibility flags, feature toggles)
 *
 * Features:
 * - Short 1-minute stale time for real-time flag updates
 * - Used to determine roster/history visibility
 *
 * @example
 * ```tsx
 * const { config, isLoading } = useBoardConfig();
 * const isRosterPublic = config?.visibility === 'public';
 * ```
 */
export function useBoardConfig() {
  const query = useQuery({
    queryKey: boardKeys.config(),
    queryFn: () => apiService.getBoardConfig(),
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for config changes)
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    ...query,
    config: query.data,
    visibility: query.data?.visibility,
    historyVisibility: query.data?.historyVisibility,
    showContactInfo: query.data?.showContactInfo ?? false,
    configLoading: query.isLoading,
  };
}

/**
 * Hook to submit contact form to board members
 *
 * Features:
 * - Mutation with success/error handling
 * - Rate limiting and CAPTCHA handled server-side
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useBoardContact();
 *
 * const handleSubmit = (formData) => {
 *   mutate(formData, {
 *     onSuccess: () => showNotification('Message sent!'),
 *     onError: (err) => showNotification(err.message),
 *   });
 * };
 * ```
 */
export function useBoardContact() {
  return useMutation({
    mutationFn: (data: BoardContactRequest) => apiService.submitBoardContact(data),
    onSuccess: () => {
      // No cache invalidation needed - contact submission doesn't affect other data
    },
  });
}

/**
 * Combined hook that provides all board-related data states
 * Useful for components that need multiple data sources
 *
 * @example
 * ```tsx
 * const board = useBoardData();
 *
 * if (board.configLoading) return <Skeleton />;
 * if (board.isRosterVisible) {
 *   return <BoardRoster members={board.members} />;
 * }
 * ```
 */
export function useBoardData() {
  const roster = useBoardRoster();
  const config = useBoardConfig();

  return {
    // Roster
    members: roster.members,
    rosterLoading: roster.isLoading,
    rosterError: roster.error,
    lastFetched: roster.lastFetched,

    // Config
    config: config.config,
    configLoading: config.isLoading,
    configError: config.error,
    visibility: config.visibility,
    historyVisibility: config.historyVisibility,
    showContactInfo: config.showContactInfo,

    // Derived states
    isRosterVisible: config.visibility === 'public' || config.visibility === 'members-only',
    isHistoryVisible: config.historyVisibility === 'public' || config.historyVisibility === 'members-only',
  };
}
