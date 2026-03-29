import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Autocomplete,
  MenuItem,
  Skeleton,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Groups,
  PersonAdd,
  PersonRemove,
  StarOutline,
  Star,
  Block,
  InfoOutlined,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useCommittees,
  useCreateCommittee,
  useUpdateCommittee,
  useDeactivateCommittee,
  useAddCommitteeMember,
  useRemoveCommitteeMember,
} from '../../hooks/useCommittees';
import { apiService } from '../../services/api';
import type { Committee, CommitteeMemberRole, User } from '../../types/api';

const CommitteeManagementPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { committees, isLoading } = useCommittees(true);
  const createCommittee = useCreateCommittee();
  const updateCommittee = useUpdateCommittee();
  const deactivateCommittee = useDeactivateCommittee();
  const addMember = useAddCommitteeMember();
  const removeMember = useRemoveCommitteeMember();

  // Committee form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [form, setForm] = useState({ name: '', description: '', approval_expiration_days: 365 });

  // Add member dialog
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberCommitteeId, setMemberCommitteeId] = useState(0);
  const [memberCommitteeName, setMemberCommitteeName] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [memberRole, setMemberRole] = useState<CommitteeMemberRole>('member');

  // User search for autocomplete
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Deactivate confirmation
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; committee: Committee | null }>({
    open: false,
    committee: null,
  });

  // Remove member confirmation
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    committeeId: number;
    userId: number;
    userName: string;
    committeeName: string;
  }>({ open: false, committeeId: 0, userId: 0, userName: '', committeeName: '' });

  // Load users for the member picker
  useEffect(() => {
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await apiService.getUsers({ limit: 500, offset: 0 });
        setAllUsers(res.users.filter((u) => !u.is_system_user && u.status === 'approved'));
      } catch {
        // Silently fail - autocomplete will just be empty
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

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
        enqueueSnackbar('Committee updated successfully', { variant: 'success' });
      } else {
        await createCommittee.mutateAsync(form);
        enqueueSnackbar('Committee created successfully', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      enqueueSnackbar('Something went wrong. Please try again.', { variant: 'error' });
    }
  };

  const openAddMember = (c: Committee) => {
    setMemberCommitteeId(c.id);
    setMemberCommitteeName(c.name);
    setSelectedUser(null);
    setMemberRole('member');
    setMemberDialogOpen(true);
  };

  // Filter out users already on this committee
  const getAvailableUsers = () => {
    const committee = committees.find((c) => c.id === memberCommitteeId);
    const existingIds = new Set(committee?.members?.map((m) => m.user_id) ?? []);
    return allUsers.filter((u) => !existingIds.has(u.id));
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    try {
      await addMember.mutateAsync({
        committeeId: memberCommitteeId,
        data: { user_id: selectedUser.id, role: memberRole },
      });
      enqueueSnackbar(
        `${selectedUser.name} has been added to the committee as ${memberRole === 'chair' ? 'Chair' : 'a member'}.`,
        { variant: 'success' }
      );
      setMemberDialogOpen(false);
    } catch {
      enqueueSnackbar('Could not add this person. They may already be on the committee.', { variant: 'error' });
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateDialog.committee) return;
    try {
      await deactivateCommittee.mutateAsync(deactivateDialog.committee.id);
      enqueueSnackbar('Committee has been deactivated.', { variant: 'success' });
      setDeactivateDialog({ open: false, committee: null });
    } catch {
      enqueueSnackbar('Could not deactivate this committee.', { variant: 'error' });
    }
  };

  const confirmRemoveMember = async () => {
    try {
      await removeMember.mutateAsync({
        committeeId: removeDialog.committeeId,
        userId: removeDialog.userId,
      });
      enqueueSnackbar(`${removeDialog.userName} has been removed from the committee.`, { variant: 'success' });
      setRemoveDialog({ ...removeDialog, open: false });
    } catch {
      enqueueSnackbar('Could not remove this member.', { variant: 'error' });
    }
  };

  const activeCommittees = committees.filter((c) => c.status === 'active');
  const inactiveCommittees = committees.filter((c) => c.status !== 'active');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Committee Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage review committees. Assign community members to serve on committees
            that review homeowner requests.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ flexShrink: 0, ml: 2 }}>
          New Committee
        </Button>
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, lg: 6 }}>
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : committees.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Groups sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Committees Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Committees review requests from homeowners. Create your first committee to get started
            with the architectural review process.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Create Your First Committee
          </Button>
        </Paper>
      ) : (
        <>
          {/* Active Committees */}
          <Grid container spacing={3}>
            {activeCommittees.map((c) => (
              <Grid key={c.id} size={{ xs: 12, lg: 6 }}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          <Groups fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{c.name}</Typography>
                          <Chip label="Active" color="success" size="small" sx={{ mt: 0.5 }} />
                        </Box>
                      </Box>
                      <Tooltip title="Edit committee">
                        <IconButton size="small" onClick={() => openEdit(c)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {c.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 2 }}>
                        {c.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 1.5, mb: 2 }}>
                      <Chip
                        icon={<InfoOutlined />}
                        label={`Approvals valid for ${c.approval_expiration_days} days`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Members ({c.members?.length ?? 0})
                      </Typography>
                      <Button size="small" startIcon={<PersonAdd />} onClick={() => openAddMember(c)}>
                        Add Person
                      </Button>
                    </Box>

                    {(!c.members || c.members.length === 0) ? (
                      <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                        No members assigned yet. Add at least one person to begin reviewing requests.
                      </Alert>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        {c.members.map((m) => (
                          <Box
                            key={m.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 0.75,
                              px: 1.5,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: m.role === 'chair' ? 'warning.main' : 'grey.400' }}>
                                {(m.user?.name ?? '?').charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {m.user?.name ?? `User #${m.user_id}`}
                                </Typography>
                                {m.user?.email && (
                                  <Typography variant="caption" color="text.secondary">
                                    {m.user.email}
                                  </Typography>
                                )}
                              </Box>
                              {m.role === 'chair' ? (
                                <Chip icon={<Star sx={{ fontSize: 16 }} />} label="Chair" size="small" color="warning" variant="outlined" />
                              ) : (
                                <Chip icon={<StarOutline sx={{ fontSize: 16 }} />} label="Member" size="small" variant="outlined" />
                              )}
                            </Box>
                            <Tooltip title={`Remove ${m.user?.name ?? 'this person'} from the committee`}>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setRemoveDialog({
                                    open: true,
                                    committeeId: c.id,
                                    userId: m.user_id,
                                    userName: m.user?.name ?? `User #${m.user_id}`,
                                    committeeName: c.name,
                                  })
                                }
                              >
                                <PersonRemove fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Block />}
                      onClick={() => setDeactivateDialog({ open: true, committee: c })}
                    >
                      Deactivate Committee
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Inactive Committees */}
          {inactiveCommittees.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                Inactive Committees
              </Typography>
              <Grid container spacing={2}>
                {inactiveCommittees.map((c) => (
                  <Grid key={c.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card variant="outlined" sx={{ opacity: 0.7 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1">{c.name}</Typography>
                            <Chip label="Inactive" size="small" sx={{ mt: 0.5 }} />
                          </Box>
                          <Tooltip title="Edit committee to reactivate">
                            <IconButton size="small" onClick={() => openEdit(c)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Create / Edit Committee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCommittee ? 'Edit Committee' : 'Create a New Committee'}</DialogTitle>
        <DialogContent>
          {!editingCommittee && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A committee is a group of community members who review and approve homeowner requests.
            </Typography>
          )}
          <TextField
            fullWidth
            label="Committee Name"
            placeholder="e.g. Architectural Review Committee"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
            helperText="Choose a clear name that describes what this committee does."
          />
          <TextField
            fullWidth
            label="Description"
            placeholder="e.g. Reviews and approves proposed changes to home exteriors..."
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Optional. Helps members understand the committee's purpose."
          />
          <TextField
            fullWidth
            type="number"
            label="How long do approvals last? (days)"
            value={form.approval_expiration_days}
            onChange={(e) => setForm({ ...form, approval_expiration_days: Number(e.target.value) })}
            helperText={`Approved requests will expire after ${form.approval_expiration_days} days. Most HOAs use 365 days (1 year).`}
            inputProps={{ min: 1, max: 3650 }}
          />
          {editingCommittee && (
            <TextField
              fullWidth
              select
              label="Status"
              value={editingCommittee.status}
              onChange={(e) => {
                setForm({ ...form, status: e.target.value } as typeof form & { status: string });
              }}
              sx={{ mt: 2 }}
              helperText="Inactive committees can no longer receive new requests."
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            {editingCommittee ? 'Save Changes' : 'Create Committee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add a Person to {memberCommitteeName}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search for a community member by name or email. Only approved members can be added to committees.
          </Typography>
          <Autocomplete
            options={getAvailableUsers()}
            getOptionLabel={(user) => `${user.name} (${user.email})`}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            loading={usersLoading}
            renderOption={(props, user) => (
              <Box component="li" {...props} key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search for a person"
                placeholder="Start typing a name or email..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {usersLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText="No matching members found"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="What role should they have?"
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value as CommitteeMemberRole)}
            helperText={
              memberRole === 'chair'
                ? 'The Chair leads the committee and has the same review powers as regular members.'
                : 'Members can review, approve, and deny requests assigned to this committee.'
            }
          >
            <MenuItem value="member">Committee Member</MenuItem>
            <MenuItem value="chair">Committee Chair</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={!selectedUser} startIcon={<PersonAdd />}>
            Add to Committee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Confirmation */}
      <Dialog
        open={deactivateDialog.open}
        onClose={() => setDeactivateDialog({ open: false, committee: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deactivate Committee?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate <strong>{deactivateDialog.committee?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This committee will no longer receive new requests. Existing requests already in progress will not be affected.
            You can reactivate it later by editing the committee.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeactivateDialog({ open: false, committee: null })}>Keep Active</Button>
          <Button variant="contained" color="error" onClick={confirmDeactivate}>
            Yes, Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog
        open={removeDialog.open}
        onClose={() => setRemoveDialog({ ...removeDialog, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove Committee Member?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove <strong>{removeDialog.userName}</strong> from <strong>{removeDialog.committeeName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            They will no longer be able to review or act on requests assigned to this committee.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveDialog({ ...removeDialog, open: false })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmRemoveMember}>
            Remove from Committee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommitteeManagementPage;
