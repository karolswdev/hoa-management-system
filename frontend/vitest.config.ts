import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        'e2e/**',
        'src/main.tsx',
        'src/App.tsx',
        '**/index.ts',
        'scripts/**',
        'src/pages/admin/**',
        'src/pages/auth/**',
        'src/pages/member/**',
        'src/pages/public/**',
        'src/pages/Polls.tsx',
        'src/components/admin/**',
        'src/components/auth/**',
        'src/components/layout/**',
        'src/components/common/ProtectedRoute.tsx',
        'src/components/common/RoleRestrictedRoute.tsx',
        'src/components/common/ReleaseBadge.tsx',
        'src/components/Board/BoardHistoryTimeline.tsx',
        'src/components/Board/ContactForm.tsx',
        'src/components/Vendors/VendorAuditLog.tsx',
        'src/contexts/AuthContext.tsx',
        'src/contexts/NotificationContext.tsx',
        'src/hooks/**',
        'src/services/**',
        'src/types/**',
        'src/utils/analytics.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
