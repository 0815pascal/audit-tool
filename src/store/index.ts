import { configureStore } from '@reduxjs/toolkit';
import verificationReducer from './verificationSlice';

// Wrap store creation in try/catch
let storeInstance;

try {
  console.log('Creating Redux store...');
  storeInstance = configureStore({
    reducer: {
      verification: verificationReducer,
    },
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware({
        // This helps with serialization issues
        serializableCheck: false,
      }),
  });
  console.log('Redux store created successfully');
} catch (error) {
  console.error('Error creating Redux store:', error);
  // Just rethrow for now - we'll handle this elsewhere
  throw error;
}

// Export the store instance
export const store = storeInstance;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
 