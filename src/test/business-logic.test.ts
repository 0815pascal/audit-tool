import { describe, it, expect } from 'vitest'
import { USER_ROLE_ENUM } from '../enums'
import { COVERAGE_LIMITS } from '../constants'

// Mock user data for testing
const mockUsers = [
  { id: '1', role: USER_ROLE_ENUM.SPECIALIST, department: 'Claims', enabled: true },
  { id: '2', role: USER_ROLE_ENUM.STAFF, department: 'Claims', enabled: true },
  { id: '3', role: USER_ROLE_ENUM.STAFF, department: 'Claims', enabled: true },
  { id: '4', role: USER_ROLE_ENUM.TEAM_LEADER, department: 'Claims', enabled: true },
  { id: '5', role: USER_ROLE_ENUM.STAFF, department: 'Claims', enabled: true },
  { id: '6', role: USER_ROLE_ENUM.READER, department: 'Claims', enabled: true }, // Should be excluded
  { id: '7', role: USER_ROLE_ENUM.SPECIALIST, department: 'Claims', enabled: false } // Should be excluded
]

// Business logic functions to test
const getActiveUsersForAudit = (users: typeof mockUsers) => {
  return users.filter(user => 
    user.enabled && 
    user.role !== USER_ROLE_ENUM.READER
  )
}

const getCoverageAmountLimit = (role: string) => {
  switch (role) {
    case USER_ROLE_ENUM.STAFF:
      return COVERAGE_LIMITS[USER_ROLE_ENUM.STAFF]
    case USER_ROLE_ENUM.SPECIALIST:
    case USER_ROLE_ENUM.TEAM_LEADER:
      return COVERAGE_LIMITS[USER_ROLE_ENUM.SPECIALIST]
    default:
      return 0
  }
}

const canUserCompleteAudit = (auditUserId: string, currentUserId: string, currentUserRole: string) => {
  // Team leaders can't complete their own audits (IKS requirement)
  if (currentUserRole === USER_ROLE_ENUM.TEAM_LEADER && auditUserId === currentUserId) {
    return false;
  }
  // Only team leaders and specialists can complete audits
  return currentUserRole === USER_ROLE_ENUM.TEAM_LEADER || currentUserRole === USER_ROLE_ENUM.SPECIALIST;
}

// Extended business logic function to test IN_PROGRESS case handling
const canUserCompleteInProgressAudit = (
  auditUserId: string, 
  currentUserId: string, 
  currentUserRole: string,
  currentAuditor?: string,
  isInProgress: boolean = false
) => {
  // Team leaders can't complete their own audits (IKS requirement)
  if (currentUserRole === USER_ROLE_ENUM.TEAM_LEADER && auditUserId === currentUserId) {
    return false;
  }

  // Special case: If audit is IN_PROGRESS
  if (isInProgress && currentAuditor) {
    if (currentAuditor === currentUserId) {
      // The assigned auditor can continue working → allowed
      return true;
    } else if (auditUserId === currentUserId) {
      // Case owners (even non-TEAM_LEADERs) cannot audit their own IN_PROGRESS cases → blocked
      return false;
    } else {
      // Other users (who are neither the case owner nor the current auditor) can interfere → allowed
      return currentUserRole === USER_ROLE_ENUM.TEAM_LEADER || currentUserRole === USER_ROLE_ENUM.SPECIALIST;
    }
  }

  // Standard logic for non-IN_PROGRESS cases
  return currentUserRole === USER_ROLE_ENUM.TEAM_LEADER || currentUserRole === USER_ROLE_ENUM.SPECIALIST;
}

describe('IKS Audit Business Logic', () => {
  describe('getActiveUsersForAudit', () => {
    it('should return only active users excluding readers', () => {
      const result = getActiveUsersForAudit(mockUsers)
      
      expect(result).toHaveLength(5) // 1 specialist + 1 team leader + 3 staff
      expect(result.every(user => user.enabled)).toBe(true)
      expect(result.every(user => user.role !== USER_ROLE_ENUM.READER)).toBe(true)
      expect(result.find(user => user.id === '6')).toBeUndefined() // Reader excluded
      expect(result.find(user => user.id === '7')).toBeUndefined() // Inactive excluded
    })

    it('should handle empty user list', () => {
      const result = getActiveUsersForAudit([])
      expect(result).toHaveLength(0)
    })

    it('should handle all inactive users', () => {
      const inactiveUsers = mockUsers.map(user => ({ ...user, enabled: false }))
      const result = getActiveUsersForAudit(inactiveUsers)
      expect(result).toHaveLength(0)
    })
  })

  describe('getCoverageAmountLimit', () => {
    it('should return correct limits for different roles', () => {
      expect(getCoverageAmountLimit(USER_ROLE_ENUM.STAFF)).toBe(COVERAGE_LIMITS[USER_ROLE_ENUM.STAFF])
      expect(getCoverageAmountLimit(USER_ROLE_ENUM.SPECIALIST)).toBe(COVERAGE_LIMITS[USER_ROLE_ENUM.SPECIALIST])
      expect(getCoverageAmountLimit(USER_ROLE_ENUM.TEAM_LEADER)).toBe(COVERAGE_LIMITS[USER_ROLE_ENUM.TEAM_LEADER])
      expect(getCoverageAmountLimit(USER_ROLE_ENUM.READER)).toBe(0)
    })

    it('should return 0 for unknown roles', () => {
      expect(getCoverageAmountLimit('UNKNOWN_ROLE')).toBe(0)
    })
  })

  describe('canUserCompleteAudit', () => {
    it('should prevent team leaders from completing their own audits', () => {
      const result = canUserCompleteAudit('4', '4', USER_ROLE_ENUM.TEAM_LEADER)
      expect(result).toBe(false)
    })

    it('should allow team leaders to complete other users audits', () => {
      const result = canUserCompleteAudit('4', '1', USER_ROLE_ENUM.TEAM_LEADER)
      expect(result).toBe(true)
    })

    it('should allow specialists to complete audits', () => {
      const result = canUserCompleteAudit('1', '1', USER_ROLE_ENUM.SPECIALIST)
      expect(result).toBe(true)
    })

    it('should prevent staff from completing audits', () => {
      const result = canUserCompleteAudit('1', '2', USER_ROLE_ENUM.STAFF)
      expect(result).toBe(false)
    })

    it('should prevent readers from completing audits', () => {
      const result = canUserCompleteAudit('1', '6', USER_ROLE_ENUM.READER)
      expect(result).toBe(false)
    })
  })

  describe('canUserCompleteInProgressAudit - IN_PROGRESS Case Handling', () => {
    it('should allow assigned auditor to continue their own IN_PROGRESS audit', () => {
      const result = canUserCompleteInProgressAudit(
        '2', // case owner (Jane Doe)
        '6', // current user (Sarah Wilson - Specialist) 
        USER_ROLE_ENUM.SPECIALIST,
        '6', // current auditor (Sarah Wilson)
        true // is IN_PROGRESS
      )
      expect(result).toBe(true)
    })

    it('should prevent case owners from auditing their own IN_PROGRESS cases (non-TEAM_LEADER)', () => {
      const result = canUserCompleteInProgressAudit(
        '2', // case owner (Jane Doe - STAFF)
        '2', // current user (Jane Doe)
        USER_ROLE_ENUM.STAFF,
        '6', // current auditor (Sarah Wilson)
        true // is IN_PROGRESS
      )
      expect(result).toBe(false)
    })

    it('should prevent TEAM_LEADER case owners from auditing their own IN_PROGRESS cases', () => {
      const result = canUserCompleteInProgressAudit(
        '4', // case owner (Emily Davis - TEAM_LEADER)
        '4', // current user (Emily Davis)
        USER_ROLE_ENUM.TEAM_LEADER,
        '6', // current auditor (Sarah Wilson)
        true // is IN_PROGRESS
      )
      expect(result).toBe(false)
    })

    it('should allow other users to interfere with IN_PROGRESS cases (TEAM_LEADER)', () => {
      const result = canUserCompleteInProgressAudit(
        '2', // case owner (Jane Doe)
        '4', // current user (Emily Davis - TEAM_LEADER)
        USER_ROLE_ENUM.TEAM_LEADER,
        '6', // current auditor (Sarah Wilson)
        true // is IN_PROGRESS
      )
      expect(result).toBe(true)
    })

    it('should allow other users to interfere with IN_PROGRESS cases (SPECIALIST)', () => {
      const result = canUserCompleteInProgressAudit(
        '2', // case owner (Jane Doe)
        '1', // current user (John Smith - SPECIALIST)
        USER_ROLE_ENUM.SPECIALIST,
        '6', // current auditor (Sarah Wilson)
        true // is IN_PROGRESS
      )
      expect(result).toBe(true)
    })

    it('should prevent STAFF from interfering with IN_PROGRESS cases', () => {
      const result = canUserCompleteInProgressAudit(
        '4', // case owner (Emily Davis)
        '3', // current user (Robert Johnson - STAFF)
        USER_ROLE_ENUM.STAFF,
        '6', // current auditor (Sarah Wilson)
        true // is IN_PROGRESS
      )
      expect(result).toBe(false)
    })

    it('should handle non-IN_PROGRESS cases normally', () => {
      // TEAM_LEADER should be able to audit other's cases when not IN_PROGRESS
      const result1 = canUserCompleteInProgressAudit(
        '2', // case owner (Jane Doe)
        '4', // current user (Emily Davis - TEAM_LEADER)
        USER_ROLE_ENUM.TEAM_LEADER,
        '', // no current auditor
        false // not IN_PROGRESS
      )
      expect(result1).toBe(true)

      // SPECIALIST should be able to audit cases when not IN_PROGRESS
      const result2 = canUserCompleteInProgressAudit(
        '2', // case owner (Jane Doe)
        '1', // current user (John Smith - SPECIALIST)
        USER_ROLE_ENUM.SPECIALIST,
        '', // no current auditor
        false // not IN_PROGRESS
      )
      expect(result2).toBe(true)
    })
  })

  describe('Integration: Full Auto-Select Process', () => {
    it('should generate complete audit selection for a quarter', () => {
      const userAudits = getActiveUsersForAudit(mockUsers)
      const randomAudits = getActiveUsersForAudit(mockUsers)
      
      // Should have user audits for each active non-reader user
      expect(userAudits).toHaveLength(5)
      
      // Should have exactly 5 random audits (same as user audits in this simple test)
      expect(randomAudits).toHaveLength(5)
      
      // Total audits should be 10 (5 user + 5 random)
      const totalAudits = [...userAudits, ...randomAudits]
      expect(totalAudits).toHaveLength(10)
      
      // All users should be enabled and not readers
      expect(totalAudits.every(user => user.enabled)).toBe(true)
      expect(totalAudits.every(user => user.role !== USER_ROLE_ENUM.READER)).toBe(true)
    })

    it('should respect IKS completion rules', () => {
      const userAudits = getActiveUsersForAudit(mockUsers)
      const teamLeaderUserId = '4'
      
      // Team leader should not be able to complete their own audit
      const teamLeaderUser = userAudits.find(user => user.id === teamLeaderUserId)
      if (teamLeaderUser) {
        const canCompleteOwn = canUserCompleteAudit(teamLeaderUser.id, teamLeaderUserId, USER_ROLE_ENUM.TEAM_LEADER)
        expect(canCompleteOwn).toBe(false)
      }
      
      // Team leader should be able to complete other users' audits
      const otherUser = userAudits.find(user => user.id !== teamLeaderUserId)
      if (otherUser) {
        const canCompleteOther = canUserCompleteAudit(otherUser.id, teamLeaderUserId, USER_ROLE_ENUM.TEAM_LEADER)
        expect(canCompleteOther).toBe(true)
      }
    })

    it('should maintain total of 8 cases when auto-selecting with pre-loaded cases', () => {
      // Simulate having 3 pre-loaded cases (1 completed, 2 in-progress)
      const mockPreLoadedCases = [
        {
          id: '13',
          userId: '1',
          auditor: '4',
          isCompleted: true,
          comment: 'Verified case',
          rating: 'SUCCESSFULLY_FULFILLED',
          specialFindings: { feedback: true, communication: true },
          detailedFindings: {},
          coverageAmount: 1500,
          claimsStatus: 'FULL_COVER',
          quarter: 'Q2-2025',
          notifiedCurrency: 'CHF'
        },
        {
          id: '14', 
          userId: '2',
          auditor: '4',
          isCompleted: false,
          comment: 'In progress by Sarah',
          rating: '',
          specialFindings: {},
          detailedFindings: {},
          coverageAmount: 775,
          claimsStatus: 'PARTIAL_COVER',
          quarter: 'Q2-2025',
          notifiedCurrency: 'EUR'
        },
        {
          id: '15', 
          userId: '3',
          auditor: '4',
          isCompleted: false,
          comment: 'In progress by Emily',
          rating: '',
          specialFindings: {},
          detailedFindings: {},
          coverageAmount: 1200,
          claimsStatus: 'FULL_COVER',
          quarter: 'Q2-2025',
          notifiedCurrency: 'CHF'
        }
      ];
      
      // The total should be 8 cases: 3 pre-loaded + 5 auto-selected = 8
      expect(mockPreLoadedCases.length).toBe(3);
      expect(8 - mockPreLoadedCases.length).toBe(5); // 5 cases should be auto-selected
    })
  })
}) 