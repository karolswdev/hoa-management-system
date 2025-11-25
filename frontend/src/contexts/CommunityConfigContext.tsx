import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import type { Config } from '../types/api';

/**
 * Community configuration context
 * Provides read-only access to HOA settings for all users
 */
interface CommunityConfigContextType {
  /** Current community configuration */
  config: Config;
  /** Whether the config is currently loading */
  loading: boolean;
  /** Error message if config failed to load */
  error: string | null;
  /** Reload the configuration */
  reload: () => Promise<void>;
}

const CommunityConfigContext = createContext<CommunityConfigContextType | undefined>(undefined);

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Config = {
  hoa_name: 'HOA Community Hub',
  hoa_description: 'Your neighborhood, connected',
  contact_email: '',
  contact_phone: '',
  address: '',
  website_url: '',
  office_hours: '',
  emergency_contact: '',
};

interface CommunityConfigProviderProps {
  children: ReactNode;
}

/**
 * CommunityConfigProvider component
 *
 * Fetches and provides community configuration to all components.
 * Configuration is publicly accessible (read-only for non-admin users).
 * Falls back to default values if config cannot be loaded.
 *
 * @example
 * ```tsx
 * <CommunityConfigProvider>
 *   <App />
 * </CommunityConfigProvider>
 * ```
 */
export const CommunityConfigProvider: React.FC<CommunityConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getCommunityConfig();

      // Merge with defaults to ensure all required fields exist
      setConfig({
        ...DEFAULT_CONFIG,
        ...response,
      });
    } catch (err: any) {
      console.warn('Failed to load community config, using defaults:', err);
      setError('Failed to load community configuration');

      // Use defaults if config fetch fails
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const value: CommunityConfigContextType = {
    config,
    loading,
    error,
    reload: loadConfig,
  };

  return (
    <CommunityConfigContext.Provider value={value}>
      {children}
    </CommunityConfigContext.Provider>
  );
};

/**
 * Hook to access community configuration
 *
 * @throws Error if used outside of CommunityConfigProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { config, loading } = useCommunityConfig();
 *
 *   if (loading) return <CircularProgress />;
 *
 *   return (
 *     <Typography variant="h4">
 *       Welcome to {config.hoa_name}
 *     </Typography>
 *   );
 * }
 * ```
 */
export const useCommunityConfig = (): CommunityConfigContextType => {
  const context = useContext(CommunityConfigContext);
  if (context === undefined) {
    throw new Error('useCommunityConfig must be used within a CommunityConfigProvider');
  }
  return context;
};
