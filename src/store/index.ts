import { configureStore } from '@reduxjs/toolkit';
import caseAuditReducer from './caseAuditSlice';
import userUIReducer, { userApi } from './userSlice';

// Wrap store creation in try/catch
let storeInstance;

try {
  console.log('Creating Redux store...');
  storeInstance = configureStore({
    reducer: {
      caseAudit: caseAuditReducer,
      userUI: userUIReducer,
      // Add the generated reducer as a specific top-level slice
      [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware({
        // This helps with serialization issues
        serializableCheck: false,
      })
      // Adding the api middleware enables caching, invalidation, polling, and other useful features of RTK Query
      .concat(userApi.middleware),
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
 