import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Determine the base path:
  // Use the repository name for 'npm run build' (production deployment)
  // Use '/' for 'npm run dev' (local development)
  const base = command === 'build' ? '/2511_QuizBasic/' : '/';

  return {
    plugins: [react()],
    base: base, // Apply the conditional base path
  };
});