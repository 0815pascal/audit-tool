import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed version of useDispatch hook for our app
 * 
 * Use this instead of plain `useDispatch` throughout your app to get proper type inference.
 * This enables TypeScript to automatically infer action types from your Redux slices.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed version of useSelector hook for our app
 * 
 * Use this instead of plain `useSelector` throughout your app to get proper type inference.
 * This enables TypeScript to automatically infer state structure.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 