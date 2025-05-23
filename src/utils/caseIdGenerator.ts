/**
 * Utility functions for generating realistic case IDs
 */

/**
 * Generates a realistic 8-digit case number starting with 4 (like 40001912)
 * @returns A string representing an 8-digit case number
 */
export const generateRealisticCaseNumber = (): string => {
  // Generate a realistic 8-digit case number starting with 4 (like 40001912)
  const baseNumber = 40000000; // Start from 40000000
  const randomSuffix = Math.floor(Math.random() * 99999); // Add up to 99999
  return (baseNumber + randomSuffix).toString();
}; 