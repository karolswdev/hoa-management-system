import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Skeleton,
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, ExpandLess, PersonRemove } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useCommittees,
  useCreateCommittee,
  useUpdateCommittee,
  useDeactivateCommittee,
  useAddCommitteeMember,
  useRemoveCommitteeMember,
} from '../../hooks/useCommittees';
import type { Committee, CommitteeMemberRole } from '../../types/api';

const CommitteeManagementPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { committees, isLoading } = useCommittees(true);
  const createCommittee = useCreateCommittee();
  const updateCommittee = useUpdateCommittee();
  const deactivateCommittee = useDeactivateCommittee();
  const addMember = useAddCommitteeMember();
  const removeMember = useRemoveCommitteeMember();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberCommitteeId, setMemberCommitteeId] = useState(0);

  const [form, setForm] = useState({ name: '', description: '', approval_expiration_days: 365 });
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'member' as CommitteeMemberRole });

  const openCreate = () => {
    setEditingCommittee(null);
    setForm({ name: '', description: '', approval_expiration_days: 365 });
    setDialogOpen(true);
  };

  const openEdit = (c: Committee) => {
    setEditingCommittee(c);
    setForm({
      name: c.name,
      description: c.description ?? '',
      approval_expiration_days: c.approval_expiration_days,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCommittee) {
        await updateCommittee.mutateAsync({ id: editingCommittee.id, data: form });
        enqueueSnackbar('Committee updated', { variant: 'success' });
      } else {
        await createCommittee.mutateAsync(form);
        enqueueSnackbar('Committee created', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateCommittee.mutateAsync(id);
      enqueueSnackbar('Committee deactivated', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to deactivate', { variant: 'error' });
    }
  };

  const openAddMember = (committeeId: number) => {
    setMemberCommitteeId(committeeId);
    setMemberForm({ user_id: '', role: 'member' });
    setMemberDialogOpen(true);
  };

  const handleAddMember = async () => {
    try {
      await addMember.mutateAsync({
        committeeId: memberCommitteeId,
        data: { user_id: Number(memberForm.user_id), role: memberForm.role },
      });
      enqueueSnackbar('Member added', { variant: 'success' });
      setMemberDialogOpen(false);
    } catch {
      enqueueSnackbar('Failed to add member', { variant: 'error' });
    }
  };

  const handleRemoveMember = async (committeeId: number, userId: number) => {
    try {
      await removeMember.mutateAsync({ committeeId, userId });
      enqueueSnackbar('Member removed', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to remove member', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Committee Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Create Committee
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Expiration (days)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              : committees.map((c) => (
                  <React.Fragment key={c.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        >
                          {expandedId === c.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.description ?? '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={c.status}
                          color={c.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{c.members?.length ?? 0}</TableCell>
                      <TableCell>{c.approval_expiration_days}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openEdit(c)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        {c.status === 'active' && (
                          <IconButton size="small" onClick={() => handleDeactivate(c.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 0, borderBottom: expandedId === c.id ? undefined : 'none' }}>
                        <Collapse in={expandedId === c.id} unmountOnExit>
                          <Box sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2">Members</Typography>
                              <Button size="small" startIcon={<Add />} onClick={() => openAddMember(c.id)}>
                                Add Member
                              </Button>
                            </Box>
                            {(!c.members || c.members.length === 0) ? (
                              <Typography variant="body2" color="text.secondary">No members.</Typography>
                            ) : (
                              <List dense disablePadding>
                                {c.members.map((m) => (
                                  <ListItem key={m.id} disableGutters>
                                    <ListItemText
                                      primary={m.user?.name ?? `User #${m.user_id}`}
                                      secondary={m.role}
                                    />
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveMember(c.id, m.user_id)}
                                      >
                                        <PersonRemove fontSize="small" />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Committee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCommittee ? 'Edit Committee' : 'Create Committee'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Approval Expiration (days)"
            value={form.approval_expiration_days}
            onChange={(e) => setForm({ ...form, approval_expiration_days: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Committee Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="User ID"
            value={memberForm.user_id}
            onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={memberForm.role}
            onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as CommitteeMemberRole })}
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="chair">Chair</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={!memberForm.user_id}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommitteeManagementPage;
