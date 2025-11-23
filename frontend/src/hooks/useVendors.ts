import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { VendorFilter, UpdateVendorRequest } from '../types/api';

/**
 * Query key factory for vendor-related queries
 * Ensures consistent cache keys across all vendor hooks
 */
export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters?: VendorFilter) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: number) => [...vendorKeys.details(), id] as const,
};

/**
 * Hook to fetch vendors list with optional filters
 *
 * Features:
 * - 60-second stale time (aligns with backend public categories cache)
 * - Filter by category, search, and status (admin-only)
 * - Role-based data exposure (guests see limited, members see contact info)
 * - Integrates with accessibility context for cache invalidation
 *
 * @param filters - Optional filters for category, search, status
 *
 * @example
 * ```tsx
 * const { vendors, isLoading, count } = useVendors({ category: 'Plumbing' });
 * ```
 */
export function useVendors(filters?: VendorFilter) {
  const query = useQuery({
    queryKey: vendorKeys.list(filters),
    queryFn: () => apiService.getVendors(filters),
    staleTime: 60 * 1000, // 60 seconds to align with backend cache TTL
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 2,
  });

  return {
    ...query,
    vendors: query.data?.vendors ?? [],
    count: query.data?.count ?? 0,
    appliedFilters: query.data?.filters,
    isLoading: query.isLoading,
    isSkeleton: query.isLoading || query.isPlaceholderData,
  };
}

/**
 * Hook to fetch a single vendor's details
 *
 * Features:
 * - 60-second stale time
 * - Role-based visibility (members see contact info, admins see moderation state)
 * - Auto-refetches when accessibility mode changes
 *
 * @param vendorId - The ID of the vendor to fetch
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { vendor, isLoading } = useVendorDetail(vendorId);
 * ```
 */
export function useVendorDetail(vendorId: number, enabled = true) {
  const query = useQuery({
    queryKey: vendorKeys.detail(vendorId),
    queryFn: () => apiService.getVendor(vendorId),
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000,
    retry: 2,
    enabled: enabled && vendorId > 0,
  });

  const isPending = query.data?.moderation_state === 'pending';
  const isApproved = query.data?.moderation_state === 'approved';
  const isDenied = query.data?.moderation_state === 'denied';

  return {
    ...query,
    vendor: query.data,
    isPending,
    isApproved,
    isDenied,
    hasContactInfo: !!query.data?.contact_info,
    hasRating: query.data?.rating !== undefined && query.data?.rating !== null,
    isLoading: query.isLoading,
    isSkeleton: query.isLoading || query.isPlaceholderData,
  };
}

/**
 * Hook to create a new vendor
 *
 * Features:
 * - Members submit for moderation (202 response)
 * - Admins can directly approve (201 response)
 * - Automatically invalidates vendor cache on success
 * - Returns created vendor with moderation status
 *
 * @example
 * ```tsx
 * const { mutate: createVendor, isPending } = useCreateVendor();
 *
 * const handleSubmit = (data: CreateVendorRequest) => {
 *   createVendor(data, {
 *     onSuccess: (response) => {
 *       if (response.message.includes('moderation')) {
 *         showToast('Vendor submitted for review');
 *       } else {
 *         showToast('Vendor created successfully');
 *       }
 *     }
 *   });
 * };
 * ```
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.createVendor,
    onSuccess: () => {
      // Invalidate all vendor lists
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing vendor (admin only)
 *
 * Features:
 * - Partial updates supported
 * - Can change moderation state
 * - Invalidates both detail and list caches
 *
 * @example
 * ```tsx
 * const { mutate: updateVendor } = useUpdateVendor();
 * ```
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVendorRequest }) =>
      apiService.updateVendor(id, data),
    onSuccess: (vendor, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}

/**
 * Hook to delete a vendor (admin only)
 *
 * @example
 * ```tsx
 * const { mutate: deleteVendor } = useDeleteVendor();
 * ```
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}

/**
 * Combined hook for vendor data with accessibility integration
 * Invalidates caches when accessibility mode changes
 *
 * @example
 * ```tsx
 * const vendorData = useVendorsData({ category: 'Landscaping' });
 * ```
 */
export function useVendorsData(filters?: VendorFilter) {
  const vendors = useVendors(filters);
  const queryClient = useQueryClient();

  // Expose method to manually invalidate caches (called when accessibility mode changes)
  const invalidateVendors = () => {
    queryClient.invalidateQueries({ queryKey: vendorKeys.all });
  };

  return {
    ...vendors,
    invalidateVendors,
  };
}
