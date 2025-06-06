import { useAppSelector } from '../store/hooks';
import {
  useGetAuditsByQuarterQuery,
  useGetAuditsByAuditorQuery,
  useGetQuarterlyAuditsQuery,
  useGetAuditFindingsQuery,
  selectUserRole,
} from '../store/caseAuditSlice';
import { QuarterPeriod } from '../types/types';
import { USER_ROLE_ENUM } from '../enums';

/**
 * Custom hook for audit-related queries with conditional fetching optimization
 * This hook implements RTK Query best practices for preventing unnecessary API calls
 */
export const useAudits = () => {
  const currentUserId = useAppSelector(state => state.auditUI.currentUserId);
  const userRole = useAppSelector(state => selectUserRole(state, currentUserId));

  /**
   * Get audits by quarter - conditionally fetch only when quarter is provided
   */
  const useAuditsByQuarter = (quarter?: QuarterPeriod, options?: {
    skipFetch?: boolean;
    enablePolling?: boolean;
  }) => {
    const { skipFetch = false, enablePolling = false } = options ?? {};
    
    return useGetAuditsByQuarterQuery(quarter!, {
      skip: !quarter || skipFetch, // Skip if no quarter provided or explicitly skipped
      pollingInterval: enablePolling ? 30000 : 0, // Poll every 30 seconds if enabled
      refetchOnMountOrArgChange: true, // Refetch when quarter changes
    });
  };

  /**
   * Get audits by auditor - conditionally fetch only when auditor ID is provided
   */
  const useAuditsByAuditor = (auditorId?: string, options?: {
    skipFetch?: boolean;
  }) => {
    const { skipFetch = false } = options ?? {};
    
    return useGetAuditsByAuditorQuery(auditorId!, {
      skip: !auditorId || skipFetch, // Skip if no auditor ID provided
      refetchOnMountOrArgChange: true,
    });
  };

  /**
   * Get quarterly audits - conditionally fetch only when quarter is provided
   */
  const useQuarterlyAudits = (quarter?: QuarterPeriod, options?: {
    skipFetch?: boolean;
    enablePolling?: boolean;
  }) => {
    const { skipFetch = false, enablePolling = false } = options ?? {};
    
    return useGetQuarterlyAuditsQuery(quarter!, {
      skip: !quarter || skipFetch, // Skip if no quarter provided
      pollingInterval: enablePolling ? 60000 : 0, // Poll every minute if enabled for live updates
      refetchOnMountOrArgChange: true,
    });
  };

  /**
   * Get audit findings - conditionally fetch only when audit ID is provided
   */
  const useAuditFindings = (auditId?: string, options?: {
    skipFetch?: boolean;
  }) => {
    const { skipFetch = false } = options ?? {};
    
    return useGetAuditFindingsQuery(auditId!, {
      skip: !auditId || skipFetch, // Skip if no audit ID provided
      refetchOnMountOrArgChange: true,
    });
  };

  /**
   * Get current user's audits (conditional on user being authenticated)
   */
  const useCurrentUserAudits = () => {
    return useAuditsByAuditor(currentUserId, {
      skipFetch: !currentUserId, // Skip if user not authenticated
    });
  };

  /**
   * Get audits with role-based conditional fetching
   * Team leaders get polling enabled, regular users don't
   */
  const useAuditsWithRoleOptimization = (quarter?: QuarterPeriod) => {
    const isTeamLeader = userRole?.role === USER_ROLE_ENUM.TEAM_LEADER;
    
    return useAuditsByQuarter(quarter, {
      enablePolling: isTeamLeader, // Only team leaders get live updates
      skipFetch: !quarter,
    });
  };

  /**
   * Selective fetching based on user permissions
   */
  const useSelectiveAudits = (quarter?: QuarterPeriod, targetUserId?: string) => {
    const canViewAllAudits = userRole?.role === USER_ROLE_ENUM.TEAM_LEADER;
    
    // Team leaders and admins can see all audits for the quarter
    const quarterlyAudits = useAuditsByQuarter(quarter, {
      skipFetch: !canViewAllAudits || !quarter,
    });

    // Regular users only see their own audits
    const userAudits = useAuditsByAuditor(targetUserId ?? currentUserId, {
      skipFetch: canViewAllAudits || !currentUserId,
    });

    return {
      quarterlyAudits: canViewAllAudits ? quarterlyAudits : { data: undefined, isLoading: false, error: null },
      userAudits: !canViewAllAudits ? userAudits : { data: undefined, isLoading: false, error: null },
      canViewAllAudits,
    };
  };



  return {
    // Basic conditional queries
    useAuditsByQuarter,
    useAuditsByAuditor,
    useQuarterlyAudits,
    useAuditFindings,
    
    // Optimized queries
    useCurrentUserAudits,
    useAuditsWithRoleOptimization,
    useSelectiveAudits,
    
    // User context
    currentUserId,
    userRole,
  };
};

/**
 * Example usage in components:
 * 
 * ```typescript
 * // Basic conditional fetching
 * const { useAuditsByQuarter } = useAudits();
 * const { data: audits } = useAuditsByQuarter(selectedQuarter, {
 *   skipFetch: !selectedQuarter, // Don't fetch if no quarter selected
 *   enablePolling: true, // Enable live updates
 * });
 * 
 * // Role-based optimization
 * const { useAuditsWithRoleOptimization } = useAudits();
 * const { data: audits } = useAuditsWithRoleOptimization(quarter);
 * 
 * // Permission-based selective fetching
 * const { useSelectiveAudits } = useAudits();
 * const { quarterlyAudits, userAudits, canViewAllAudits } = useSelectiveAudits(quarter);
 * ```
 */ 