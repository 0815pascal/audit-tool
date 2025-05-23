import { ApiCache } from '../types';
import { DEFAULT_CACHE_TTL } from './apiUtils';

/**
 * Type-safe generic cache for API responses or other data
 */
export class TypedCache<T> {
  private cache: ApiCache<T>;
  private ttl: number;
  
  /**
   * Create a new typed cache
   * @param ttl Cache time-to-live in milliseconds
   */
  constructor(ttl: number = DEFAULT_CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  /**
   * Set cache item with current timestamp
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get cache item if valid, otherwise return null
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist or is expired
    if (!item || Date.now() - item.timestamp > this.ttl) {
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Check if cache has a valid item for key
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && (Date.now() - item.timestamp <= this.ttl);
  }
  
  /**
   * Delete an item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get all valid cache keys
   */
  keys(): string[] {
    const validKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (Date.now() - item.timestamp <= this.ttl) {
        validKeys.push(key);
      }
    });
    
    return validKeys;
  }
  
  /**
   * Get all valid cache entries
   */
  entries(): { key: string; data: T }[] {
    const validEntries: { key: string; data: T }[] = [];
    
    this.cache.forEach((item, key) => {
      if (Date.now() - item.timestamp <= this.ttl) {
        validEntries.push({ key, data: item.data });
      }
    });
    
    return validEntries;
  }
  
  /**
   * Get the cache size (number of valid entries)
   */
  size(): number {
    return this.keys().length;
  }
} 