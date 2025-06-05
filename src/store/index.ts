import { configureStore } from '@reduxjs/toolkit';
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
      // This helps with serialization issues
      serializableCheck: false,
    })
    // Single API middleware for optimal performance
    .concat(api.middleware),
});

// Export the store instance
export default store;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
 