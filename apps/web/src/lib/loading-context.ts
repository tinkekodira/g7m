import { createContext } from 'react';

export const LoadingStarted = createContext<number | null>(null);
export const LOADING_DELAY_MS = 250;
