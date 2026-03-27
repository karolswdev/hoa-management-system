import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkflowStatusBadge from '../components/ARC/WorkflowStatusBadge';
import type { WorkflowStatus } from '../types/api';
import { describe, it, expect } from 'vitest';

describe('WorkflowStatusBadge', () => {
  const statuses: { status: WorkflowStatus; label: string }[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'submitted', label: 'Submitted' },
    { status: 'under_review', label: 'Under Review' },
    { status: 'approved', label: 'Approved' },
    { status: 'denied', label: 'Denied' },
    { status: 'withdrawn', label: 'Withdrawn' },
    { status: 'appealed', label: 'Appealed' },
    { status: 'appeal_under_review', label: 'Appeal Under Review' },
    { status: 'appeal_approved', label: 'Appeal Approved' },
    { status: 'appeal_denied', label: 'Appeal Denied' },
    { status: 'expired', label: 'Expired' },
  ];

  statuses.forEach(({ status, label }) => {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<WorkflowStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders as small chip by default', () => {
    const { container } = render(<WorkflowStatusBadge status="approved" />);
    expect(container.querySelector('.MuiChip-sizeSmall')).toBeInTheDocument();
  });

  it('renders as medium chip when specified', () => {
    const { container } = render(<WorkflowStatusBadge status="approved" size="medium" />);
    expect(container.querySelector('.MuiChip-sizeMedium')).toBeInTheDocument();
  });
});
