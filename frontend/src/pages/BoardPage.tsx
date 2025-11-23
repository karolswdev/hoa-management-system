import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  useTheme,
} from '@mui/material';
import { Group, History, Email } from '@mui/icons-material';
import { BoardRoster, BoardHistoryTimeline, ContactForm } from '../components/Board';
import { useBoardContact } from '../hooks/useBoard';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAuth } from '../contexts/AuthContext';
import type { ContactFormData } from '../components/Board/ContactForm';

/**
 * TabPanel component for managing tab content visibility
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`board-tabpanel-${index}`}
      aria-labelledby={`board-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

/**
 * a11y props for tabs
 */
function a11yProps(index: number) {
  return {
    id: `board-tab-${index}`,
    'aria-controls': `board-tabpanel-${index}`,
  };
}

/**
 * BoardPage Component
 *
 * Main page for board member information, integrating:
 * - BoardRoster (current members)
 * - BoardHistoryTimeline (past members - auth required)
 * - ContactForm (contact board members)
 *
 * Features:
 * - Tab-based navigation between sections
 * - Feature flag gating via config metadata
 * - Accessibility-aware skeleton states
 * - High-visibility mode support
 * - React Query caching with TTL
 *
 * @example
 * ```tsx
 * <Route path="/board" element={<BoardPage />} />
 * ```
 */
const BoardPage: React.FC = () => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [contactSuccess, setContactSuccess] = useState<string | undefined>();
  const [contactError, setContactError] = useState<string | undefined>();

  const { mutate: submitContact, isPending: isSubmitting } = useBoardContact();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Clear contact form messages when switching tabs
    if (newValue !== 2) {
      setContactSuccess(undefined);
      setContactError(undefined);
    }
  };

  const handleContactSubmit = async (data: ContactFormData) => {
    setContactSuccess(undefined);
    setContactError(undefined);

    submitContact(
      {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      },
      {
        onSuccess: () => {
          setContactSuccess(
            'Your message has been sent successfully. A board member will respond to you shortly.'
          );
          setContactError(undefined);
        },
        onError: (error: Error) => {
          setContactError(
            (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
              'Failed to send your message. Please try again later.'
          );
          setContactSuccess(undefined);
        },
      }
    );
  };

  return (
    <Container maxWidth="lg">
      <Box py={theme.spacing(4)}>
        {/* Page Header */}
        <Box mb={theme.spacing(4)}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
            }}
          >
            Board of Directors
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Meet the current HOA board members, view historical records, and get in touch.
          </Typography>
        </Box>

        {/* Tabs Navigation */}
        <Paper
          elevation={isHighVisibility ? 0 : 2}
          sx={{
            border: isHighVisibility ? `2px solid ${theme.palette.primary.dark}` : undefined,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Board sections"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Tab
              icon={<Group />}
              label="Current Board"
              {...a11yProps(0)}
              sx={{
                minHeight: isHighVisibility ? 64 : 48,
                fontSize: isHighVisibility ? '1.1rem' : undefined,
              }}
            />
            <Tab
              icon={<History />}
              label="History"
              {...a11yProps(1)}
              sx={{
                minHeight: isHighVisibility ? 64 : 48,
                fontSize: isHighVisibility ? '1.1rem' : undefined,
              }}
            />
            <Tab
              icon={<Email />}
              label="Contact"
              {...a11yProps(2)}
              sx={{
                minHeight: isHighVisibility ? 64 : 48,
                fontSize: isHighVisibility ? '1.1rem' : undefined,
              }}
            />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <BoardRoster />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <BoardHistoryTimeline />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box p={theme.spacing(3)}>
              <Typography variant="h4" component="h2" gutterBottom>
                Contact Board Members
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Send a message to the board of directors. You will receive a response at the
                email address you provide.
              </Typography>

              <ContactForm
                onSubmit={handleContactSubmit}
                initialValues={{
                  name: user?.name || '',
                  email: user?.email || '',
                }}
                isLoading={isSubmitting}
                error={contactError}
                success={contactSuccess}
              />
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default BoardPage;
