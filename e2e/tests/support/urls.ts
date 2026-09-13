/** Where the fake backend listens. Chosen away from `supabase start`'s 54321. */
export const BACKEND_PORT = 54380;
export const BACKEND_URL = `http://127.0.0.1:${String(BACKEND_PORT)}`;

/** Where `vite preview` serves the build under test. */
export const APP_URL = 'http://127.0.0.1:4380';
