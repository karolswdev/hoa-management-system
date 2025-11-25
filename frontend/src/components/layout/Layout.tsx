import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Announcement,
  Event,
  Description,
  Forum,
  Person,
  AdminPanelSettings,
  People,
  Settings,
  History,
  Logout,
  HowToVote,
  Store,
  Help,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCommunityConfig } from '../../contexts/CommunityConfigContext';
import ReleaseBadge from '../common/ReleaseBadge';
import AccessibilityToggle from '../Accessibility/Toggle';
import { trackAccessibilityToggle } from '../../utils/analytics';

const drawerWidth = 240;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Announcements', icon: <Announcement />, path: '/announcements' },
  { text: 'Events', icon: <Event />, path: '/events' },
  { text: 'Documents', icon: <Description />, path: '/documents' },
  { text: 'Discussions', icon: <Forum />, path: '/discussions' },
  { text: 'Polls', icon: <HowToVote />, path: '/polls' },
  { text: 'Vendors', icon: <Store />, path: '/vendors' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
];

const adminNavigationItems: NavigationItem[] = [
  { text: 'Admin Dashboard', icon: <AdminPanelSettings />, path: '/admin/dashboard', adminOnly: true },
  { text: 'User Management', icon: <People />, path: '/admin/users', adminOnly: true },
  { text: 'Manage Announcements', icon: <Announcement />, path: '/admin/announcements', adminOnly: true },
  { text: 'Manage Events', icon: <Event />, path: '/admin/events', adminOnly: true },
  { text: 'Manage Documents', icon: <Description />, path: '/admin/documents', adminOnly: true },
  { text: 'Manage Vendors', icon: <Store />, path: '/admin/vendors', adminOnly: true },
  { text: 'Site Configuration', icon: <Settings />, path: '/admin/config', adminOnly: true },
  { text: 'Audit Logs', icon: <History />, path: '/admin/audit', adminOnly: true },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { config } = useCommunityConfig();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Toolbar sx={{
        flexDirection: 'column',
        alignItems: 'flex-start',
        pt: 2.5,
        pb: 2,
        gap: 0.5,
      }}>
        <Typography variant="h6" noWrap component="div" sx={{
          fontWeight: 'bold',
          background: (theme) => theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #003366 0%, #4F6B5A 100%)'
            : 'inherit',
          WebkitBackgroundClip: (theme) => theme.palette.mode === 'light' ? 'text' : 'inherit',
          WebkitTextFillColor: (theme) => theme.palette.mode === 'light' ? 'transparent' : 'inherit',
          backgroundClip: (theme) => theme.palette.mode === 'light' ? 'text' : 'inherit',
        }}>
          {config.hoa_name || 'HOA Community Hub'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
          {config.hoa_description || 'Your neighborhood, connected'}
        </Typography>
      </Toolbar>
      <Divider sx={{
        borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0, 51, 102, 0.12)' : 'divider'
      }} />
      
      {/* Member Navigation */}
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Admin Navigation */}
      {isAdmin && (
        <>
          <Divider />
          <List>
            <ListItem>
              <ListItemText
                primary="Administration"
                primaryTypographyProps={{
                  variant: 'overline',
                  color: 'text.secondary',
                  fontWeight: 'bold'
                }}
              />
            </ListItem>
            {adminNavigationItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Accessibility Toggle in Drawer */}
      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessibilityToggle
            variant="drawer"
            onAnalytics={(event) => trackAccessibilityToggle(event.context, event.featureFlagState.highVis)}
          />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            High Visibility Mode
          </Typography>
        </Box>
        <Box sx={{ px: 2, pb: 1 }}>
          <ListItemButton
            component="a"
            href="/user-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderRadius: 1,
              gap: 1.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <Help />
            </ListItemIcon>
            <ListItemText
              primary="User Guide"
              secondary="View PDF documentation"
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
          <ReleaseBadge />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {/* Page title could be dynamic based on current route */}
          </Typography>

          {/* Accessibility Toggle */}
          <Box sx={{ mr: 2 }}>
            <AccessibilityToggle
              variant="navbar"
              onAnalytics={(event) => trackAccessibilityToggle(event.context, event.featureFlagState.highVis)}
            />
          </Box>

          {/* User Profile Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.name}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // AppBar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
