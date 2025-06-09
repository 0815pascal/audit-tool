import { SetupWorker } from 'msw/browser';
import { AppDispatch } from '../store';
import { setMswStatus, setMswError } from '../store/uiSlice';

/**
 * Service for managing MSW (Mock Service Worker) lifecycle
 */
export class MSWService {
  private static instance: MSWService;
  private worker: SetupWorker | null = null;
  private dispatch: AppDispatch | null = null;

  private constructor() {}

  static getInstance(): MSWService {
    if (!MSWService.instance) {
      MSWService.instance = new MSWService();
    }
    return MSWService.instance;
  }

  /**
   * Initialize the service with Redux dispatch
   */
  initialize(dispatch: AppDispatch): void {
    this.dispatch = dispatch;
  }

  /**
   * Start MSW worker
   */
  async start(): Promise<boolean> {
    if (!this.dispatch) {
      console.error('[MSW Service] Not initialized with dispatch');
      return false;
    }

    try {
      this.dispatch(setMswStatus('starting'));

      // Dynamic import to avoid loading MSW in production builds
      const { worker } = await import('../mocks/browser');
      this.worker = worker;

      await this.worker.start({
        onUnhandledRequest: 'bypass',
        quiet: false, // Allow MSW logging for debugging
      });

      this.dispatch(setMswStatus('active'));
      console.log('[MSW Service] Mock Service Worker started successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[MSW Service] Failed to start:', error);
      this.dispatch(setMswError(`Failed to start MSW: ${errorMessage}`));
      return false;
    }
  }

  /**
   * Stop MSW worker
   */
  async stop(): Promise<boolean> {
    if (!this.dispatch) {
      console.error('[MSW Service] Not initialized with dispatch');
      return false;
    }

    try {
      if (this.worker) {
        this.worker.stop();
        this.worker = null;
        console.log('[MSW Service] Mock Service Worker stopped');
      }

      this.dispatch(setMswStatus('inactive'));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[MSW Service] Failed to stop:', error);
      this.dispatch(setMswError(`Failed to stop MSW: ${errorMessage}`));
      return false;
    }
  }

  /**
   * Restart MSW worker
   */
  async restart(): Promise<boolean> {
    await this.stop();
    // Small delay to ensure clean shutdown
    await new Promise(resolve => setTimeout(resolve, 100));
    return await this.start();
  }

  /**
   * Check if MSW is currently active
   */
  isActive(): boolean {
    return this.worker !== null;
  }

  /**
   * Get current worker instance (for debugging)
   */
  getWorker(): SetupWorker | null {
    return this.worker;
  }
}

// Export singleton instance
export const mswService = MSWService.getInstance();

// Export convenience functions
export const startMSW = () => mswService.start();
export const stopMSW = () => mswService.stop();
export const restartMSW = () => mswService.restart(); 