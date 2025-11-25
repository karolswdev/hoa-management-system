import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCommunityConfig } from '../../contexts/CommunityConfigContext';

/**
 * DynamicTitle component
 *
 * Automatically updates the browser tab title based on the current route
 * and community configuration. Provides better UX by showing the community
 * name and current page in the browser tab.
 *
 * @example
 * ```tsx
 * <Router>
 *   <DynamicTitle />
 *   <Routes>...</Routes>
 * </Router>
 * ```
 */
const DynamicTitle: React.FC = () => {
  const location = useLocation();
  const { config } = useCommunityConfig();

  useEffect(() => {
    const communityName = config.hoa_name || 'HOA Community Hub';

    // Map routes to page titles
    const routeTitles: Record<string, string> = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/announcements': 'Announcements',
      '/events': 'Events',
      '/documents': 'Documents',
      '/discussions': 'Discussions',
      '/board': 'Board',
      '/polls': 'Polls',
      '/vendors': 'Vendors',
      '/profile': 'Profile',
      '/admin/dashboard': 'Admin Dashboard',
      '/admin/users': 'User Management',
      '/admin/announcements': 'Manage Announcements',
      '/admin/events': 'Manage Events',
      '/admin/documents': 'Manage Documents',
      '/admin/vendors': 'Manage Vendors',
      '/admin/config': 'System Configuration',
      '/admin/audit': 'Audit Logs',
      '/login': 'Sign In',
      '/register': 'Register',
      '/forgot-password': 'Forgot Password',
      '/reset-password': 'Reset Password',
      '/verify-email': 'Verify Email',
      '/resend-verification': 'Resend Verification',
      '/public': 'Public Information',
    };

    // Get the page title based on current route
    let pageTitle = routeTitles[location.pathname];

    // Handle dynamic routes
    if (!pageTitle) {
      if (location.pathname.startsWith('/discussions/')) {
        pageTitle = 'Discussion';
      } else if (location.pathname.startsWith('/polls/') && location.pathname.includes('/receipts/')) {
        pageTitle = 'Poll Receipt';
      } else if (location.pathname.startsWith('/polls/')) {
        pageTitle = 'Poll Details';
      }
    }

    // Set the document title
    if (pageTitle) {
      document.title = `${pageTitle} | ${communityName}`;
    } else {
      document.title = communityName;
    }
  }, [location.pathname, config.hoa_name]);

  return null; // This component doesn't render anything
};

export default DynamicTitle;
