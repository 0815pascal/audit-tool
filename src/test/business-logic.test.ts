import { describe, it, expect } from 'vitest'
import { USER_ROLE_ENUM, AUDIT_STATUS_ENUM, CASE_TYPE_ENUM } from '../enums'
import { generateRealisticCaseNumber } from '../utils/statusUtils'
import { COVERAGE_LIMITS } from '../constants'

// Mock user data for testing
const mockUsers = [
  { id: '1', name: 'Team Leader 1', role: USER_ROLE_ENUM.TEAM_LEADER, isActive: true },
  { id: '2', name: 'Specialist 1', role: USER_ROLE_ENUM.SPECIALIST, isActive: true },
  { id: '3', name: 'Staff 1', role: USER_ROLE_ENUM.STAFF, isActive: true },
  { id: '4', name: 'Staff 2', role: USER_ROLE_ENUM.STAFF, isActive: true },
  { id: '5', name: 'Reader 1', role: USER_ROLE_ENUM.READER, isActive: true },
  { id: '6', name: 'Inactive Staff', role: USER_ROLE_ENUM.STAFF, isActive: false },
]

// Business logic functions to test
const getActiveUsersForAudit = (users: typeof mockUsers) => {
  return users.filter(user => 
    user.isActive && 
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

const generateUserAuditsForQuarter = (users: typeof mockUsers) => {
  const activeUsers = getActiveUsersForAudit(users)
  
  return activeUsers.map(user => {
    const maxCoverage = getCoverageAmountLimit(user.role)
    const coverageAmount = Math.floor(Math.random() * maxCoverage * 0.8) + 1000
    
    return {
      id: `audit-${user.id}-${Date.now()}`,
      userId: user.id,
      coverageAmount,
      status: AUDIT_STATUS_ENUM.PENDING,
      caseType: CASE_TYPE_ENUM.USER_QUARTERLY,
      isCompleted: false
    }
  })
}

const generatePreviousQuarterRandomAudits = (count: number = 2) => {
  return Array.from({ length: count }).map(() => ({
    id: `prev-quarter-${generateRealisticCaseNumber()}`,
    userId: '', // Random audits not tied to specific user
    coverageAmount: Math.floor(Math.random() * 100000) + 5000,
    status: AUDIT_STATUS_ENUM.PENDING,
    caseType: CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM,
    isCompleted: false
  }))
}

describe('IKS Audit Business Logic', () => {
  describe('getActiveUsersForAudit', () => {
    it('should return only active users excluding readers', () => {
      const result = getActiveUsersForAudit(mockUsers)
      
      expect(result).toHaveLength(4) // 1 team leader + 1 specialist + 2 staff
      expect(result.every(user => user.isActive)).toBe(true)
      expect(result.every(user => user.role !== USER_ROLE_ENUM.READER)).toBe(true)
      expect(result.find(user => user.id === '5')).toBeUndefined() // Reader excluded
      expect(result.find(user => user.id === '6')).toBeUndefined() // Inactive excluded
    })

    it('should handle empty user list', () => {
      const result = getActiveUsersForAudit([])
      expect(result).toHaveLength(0)
    })

    it('should handle all inactive users', () => {
      const inactiveUsers = mockUsers.map(user => ({ ...user, isActive: false }))
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
      const result = canUserCompleteAudit('1', '1', USER_ROLE_ENUM.TEAM_LEADER)
      expect(result).toBe(false)
    })

    it('should allow team leaders to complete other users audits', () => {
      const result = canUserCompleteAudit('2', '1', USER_ROLE_ENUM.TEAM_LEADER)
      expect(result).toBe(true)
    })

    it('should allow specialists to complete audits', () => {
      const result = canUserCompleteAudit('1', '2', USER_ROLE_ENUM.SPECIALIST)
      expect(result).toBe(true)
    })

    it('should prevent staff from completing audits', () => {
      const result = canUserCompleteAudit('1', '3', USER_ROLE_ENUM.STAFF)
      expect(result).toBe(false)
    })

    it('should prevent readers from completing audits', () => {
      const result = canUserCompleteAudit('1', '5', USER_ROLE_ENUM.READER)
      expect(result).toBe(false)
    })
  })

  describe('generateUserAuditsForQuarter', () => {
    it('should generate one audit per active user (excluding readers)', () => {
      const result = generateUserAuditsForQuarter(mockUsers)
      
      expect(result).toHaveLength(4) // 4 active non-reader users
      expect(result.every(audit => audit.status === AUDIT_STATUS_ENUM.PENDING)).toBe(true)
      expect(result.every(audit => audit.caseType === CASE_TYPE_ENUM.USER_QUARTERLY)).toBe(true)
      expect(result.every(audit => !audit.isCompleted)).toBe(true)
    })

    it('should respect coverage amount limits by role', () => {
      const result = generateUserAuditsForQuarter(mockUsers)
      
      // Find audits for different roles
      const staffAudit = result.find(audit => {
        const user = mockUsers.find(u => u.id === audit.userId)
        return user?.role === USER_ROLE_ENUM.STAFF
      })
      
      const specialistAudit = result.find(audit => {
        const user = mockUsers.find(u => u.id === audit.userId)
        return user?.role === USER_ROLE_ENUM.SPECIALIST
      })
      
      // Staff should have lower coverage amounts
      if (staffAudit) {
        expect(staffAudit.coverageAmount).toBeLessThanOrEqual(COVERAGE_LIMITS[USER_ROLE_ENUM.STAFF])
      }
      
      // Specialists should have higher coverage amounts
      if (specialistAudit) {
        expect(specialistAudit.coverageAmount).toBeLessThanOrEqual(COVERAGE_LIMITS[USER_ROLE_ENUM.SPECIALIST])
      }
    })

    it('should generate unique audit IDs', () => {
      const result = generateUserAuditsForQuarter(mockUsers)
      const ids = result.map(audit => audit.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('generatePreviousQuarterRandomAudits', () => {
    it('should generate the specified number of random audits', () => {
      const result = generatePreviousQuarterRandomAudits(2)
      
      expect(result).toHaveLength(2)
      expect(result.every(audit => audit.status === AUDIT_STATUS_ENUM.PENDING)).toBe(true)
      expect(result.every(audit => audit.caseType === CASE_TYPE_ENUM.PREVIOUS_QUARTER_RANDOM)).toBe(true)
      expect(result.every(audit => !audit.isCompleted)).toBe(true)
    })

    it('should generate audits with random coverage amounts', () => {
      const result = generatePreviousQuarterRandomAudits(5)
      
      // All should be within the expected range (5k-105k)
      expect(result.every(audit => 
        audit.coverageAmount >= 5000 && audit.coverageAmount <= 105000
      )).toBe(true)
      
      // Should have some variation (not all the same)
      const amounts = result.map(audit => audit.coverageAmount)
      const uniqueAmounts = new Set(amounts)
      expect(uniqueAmounts.size).toBeGreaterThan(1)
    })

    it('should generate unique audit IDs', () => {
      const result = generatePreviousQuarterRandomAudits(3)
      const ids = result.map(audit => audit.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should handle custom count parameter', () => {
      expect(generatePreviousQuarterRandomAudits(0)).toHaveLength(0)
      expect(generatePreviousQuarterRandomAudits(1)).toHaveLength(1)
      expect(generatePreviousQuarterRandomAudits(5)).toHaveLength(5)
    })
  })

  describe('Integration: Full Auto-Select Process', () => {
    it('should generate complete audit selection for a quarter', () => {
      const userAudits = generateUserAuditsForQuarter(mockUsers)
      const randomAudits = generatePreviousQuarterRandomAudits(2)
      
      // Should have user audits for each active non-reader user
      expect(userAudits).toHaveLength(4)
      
      // Should have exactly 2 random audits
      expect(randomAudits).toHaveLength(2)
      
      // Total audits should be 6 (4 user + 2 random)
      const totalAudits = [...userAudits, ...randomAudits]
      expect(totalAudits).toHaveLength(6)
      
      // All audits should be pending initially
      expect(totalAudits.every(audit => !audit.isCompleted)).toBe(true)
      expect(totalAudits.every(audit => audit.status === AUDIT_STATUS_ENUM.PENDING)).toBe(true)
    })

    it('should respect IKS completion rules', () => {
      const userAudits = generateUserAuditsForQuarter(mockUsers)
      const teamLeaderUserId = '1'
      
      // Team leader should not be able to complete their own audit
      const teamLeaderAudit = userAudits.find(audit => audit.userId === teamLeaderUserId)
      if (teamLeaderAudit) {
        const canCompleteOwn = canUserCompleteAudit(teamLeaderAudit.userId, teamLeaderUserId, USER_ROLE_ENUM.TEAM_LEADER)
        expect(canCompleteOwn).toBe(false)
      }
      
      // Team leader should be able to complete other users' audits
      const otherUserAudit = userAudits.find(audit => audit.userId !== teamLeaderUserId)
      if (otherUserAudit) {
        const canCompleteOther = canUserCompleteAudit(otherUserAudit.userId, teamLeaderUserId, USER_ROLE_ENUM.TEAM_LEADER)
        expect(canCompleteOther).toBe(true)
      }
    })
  })
}) 