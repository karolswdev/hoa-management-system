import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CodeOfConductModal from '../components/discussions/CodeOfConductModal';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    acceptCodeOfConduct: vi.fn(),
  },
}));

import { apiService } from '../services/api';

const mockOnAccept = vi.fn();

const defaultProps = {
  open: true,
  content: 'Be respectful to all community members.\n\nNo spam or harassment.',
  version: '1',
  communityName: 'Test HOA',
  onAccept: mockOnAccept,
  canDismiss: false,
};

const renderModal = (props = {}) => {
  return render(
    <NotificationProvider>
      <CodeOfConductModal {...defaultProps} {...props} />
    </NotificationProvider>
  );
};

describe('CodeOfConductModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.acceptCodeOfConduct as any).mockResolvedValue({ message: 'Accepted' });
  });

  describe('Rendering', () => {
    it('renders the modal when open', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderModal({ open: false });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays the community name in the title', () => {
      renderModal();
      expect(screen.getByText(/Community Discussions Code of Conduct/i)).toBeInTheDocument();
    });

    it('displays the Code of Conduct content', () => {
      renderModal();
      expect(screen.getByText(/Be respectful to all community members/i)).toBeInTheDocument();
    });

    it('displays the acceptance checkbox', () => {
      renderModal();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('displays the accept button', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /Accept.*Continue/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('accept button is disabled when checkbox is not checked', () => {
      renderModal();
      const acceptButton = screen.getByRole('button', { name: /Accept.*Continue/i });
      expect(acceptButton).toBeDisabled();
    });

    it('accept button is enabled when checkbox is checked', () => {
      renderModal();
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      const acceptButton = screen.getByRole('button', { name: /Accept.*Continue/i });
      expect(acceptButton).not.toBeDisabled();
    });

    it('calls API and onAccept when accepting', async () => {
      renderModal();

      // Check the checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Click accept
      const acceptButton = screen.getByRole('button', { name: /Accept.*Continue/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(apiService.acceptCodeOfConduct).toHaveBeenCalledWith('1');
        expect(mockOnAccept).toHaveBeenCalled();
      });
    });

    it('shows loading state while accepting', async () => {
      // Make the API call take longer
      (apiService.acceptCodeOfConduct as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'ok' }), 100))
      );

      renderModal();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const acceptButton = screen.getByRole('button', { name: /Accept.*Continue/i });
      fireEvent.click(acceptButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      (apiService.acceptCodeOfConduct as any).mockRejectedValue(new Error('Network error'));

      renderModal();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const acceptButton = screen.getByRole('button', { name: /Accept.*Continue/i });
      fireEvent.click(acceptButton);

      // Should show error alert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Dismissal Behavior', () => {
    it('does not allow escape key dismissal when canDismiss is false', () => {
      renderModal({ canDismiss: false });
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Dialog should still be present after escape attempt
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
