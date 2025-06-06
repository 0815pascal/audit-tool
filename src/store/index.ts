import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import auditUIReducer from './caseAuditSlice';
import userUIReducer from './userSlice';
import api from './api';

// Configure the Redux store
const store = configureStore({
  reducer: {
    auditUI: auditUIReducer,
    userUI: userUIReducer,
    // Single API reducer for all endpoints
    [api.reducerPath]: api.reducer,
  },
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      // Configure serialization check to ignore specific action types and paths
      serializableCheck: {
        ignoredActions: [
          // Ignore RTK Query actions that may contain non-serializable data
          'api/executeQuery/fulfilled',
          'api/executeQuery/pending',
          'api/executeQuery/rejected',
          'api/executeMutation/fulfilled',
          'api/executeMutation/pending',
          'api/executeMutation/rejected',
        ],
        ignoredPaths: [
          // Ignore RTK Query cache paths that may contain non-serializable data
          'api.queries',
          'api.mutations',
        ],
      },
    })
    // Single API middleware for optimal performance
    .concat(api.middleware),
});

// Enable automatic refetching on focus/reconnect (RTK Query best practice)
setupListeners(store.dispatch);

// Export the store instance
export default store;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
 