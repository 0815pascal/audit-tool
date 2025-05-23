import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  ApiResponse, 
  Optional,
  StringDictionary
} from '../types';
import { createSuccessResponse, createErrorResponse, handleApiError } from './apiUtils';

/**
 * Type-safe generic API service for consistent API handling
 */
export class ApiService {
  private api: AxiosInstance;
  private defaultHeaders: StringDictionary;
  
  constructor(baseURL: string = '/api', timeout: number = 30000, defaultHeaders: StringDictionary = {}) {
    this.api = axios.create({
      baseURL,
      timeout,
      validateStatus: () => true // Handle all status codes in catch blocks
    });
    this.defaultHeaders = defaultHeaders;
  }
  
  /**
   * Set authorization token for all subsequent requests
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  /**
   * Clear authorization token
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
  
  /**
   * Create config with default headers
   */
  private createConfig(config: Optional<AxiosRequestConfig> = {}): AxiosRequestConfig {
    return {
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...(config?.headers || {})
      }
    };
  }
  
  /**
   * Generic GET request with type safety
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<T>(url, this.createConfig(config));
      
      if (response.status >= 400) {
        return createErrorResponse(`Request failed with status ${response.status}`, response.status);
      }
      
      return createSuccessResponse(response.data);
    } catch (error) {
      return createErrorResponse(handleApiError(error).message);
    }
  }
  
  /**
   * Type-safe URL with path parameters
   * Example: api.getWithParams<User>('/users/:id', { id: '123' })
   */
  async getWithParams<T, P extends StringDictionary>(
    urlTemplate: string,
    params: P,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(urlTemplate, params);
    return this.get<T>(url, config);
  }
  
  /**
   * Generic POST request with type safety
   */
  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post<T>(url, data, this.createConfig(config));
      
      if (response.status >= 400) {
        return createErrorResponse(`Request failed with status ${response.status}`, response.status);
      }
      
      return createSuccessResponse(response.data);
    } catch (error) {
      return createErrorResponse(handleApiError(error).message);
    }
  }
  
  /**
   * Generic PUT request with type safety
   */
  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<T>(url, data, this.createConfig(config));
      
      if (response.status >= 400) {
        return createErrorResponse(`Request failed with status ${response.status}`, response.status);
      }
      
      return createSuccessResponse(response.data);
    } catch (error) {
      return createErrorResponse(handleApiError(error).message);
    }
  }
  
  /**
   * Generic DELETE request with type safety
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<T>(url, this.createConfig(config));
      
      if (response.status >= 400) {
        return createErrorResponse(`Request failed with status ${response.status}`, response.status);
      }
      
      return createSuccessResponse(response.data);
    } catch (error) {
      return createErrorResponse(handleApiError(error).message);
    }
  }
  
  /**
   * Build URL with parameters
   * Replaces :param in URL with corresponding value from params object
   */
  private buildUrl(urlTemplate: string, params: StringDictionary): string {
    let url = urlTemplate;
    
    // Replace all :param placeholders with actual values
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(String(value)));
    });
    
    return url;
  }
} 