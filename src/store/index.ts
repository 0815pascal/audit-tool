import { configureStore } from '@reduxjs/toolkit';
import auditUIReducer, { auditApi } from './caseAuditSlice';
import userUIReducer, { userApi } from './userSlice';

// Configure the Redux store
const store = configureStore({
  reducer: {
    auditUI: auditUIReducer,
    userUI: userUIReducer,
    // Add the generated reducers as specific top-level slices
    [auditApi.reducerPath]: auditApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      // This helps with serialization issues
      serializableCheck: false,
    })
    // Adding the api middleware enables caching, invalidation, polling, and other useful features of RTK Query
    .concat(auditApi.middleware)
    .concat(userApi.middleware),
});

// Export the store instance
export default store;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
 