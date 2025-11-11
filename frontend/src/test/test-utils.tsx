import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';

const theme = createTheme();

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock user data
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'member',
  status: 'approved',
  email_verified: true,
};

export const mockAdminUser = {
  id: 2,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  status: 'approved',
  email_verified: true,
};

// Mock token
export const mockToken = 'mock-jwt-token';

// Helper to set up authenticated user
export const setupAuthenticatedUser = (user = mockUser, token = mockToken) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

// Helper to clear authentication
export const clearAuthentication = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};
