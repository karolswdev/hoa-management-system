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
  Skeleton,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Block, Category } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useArcCategories,
  useCreateArcCategory,
  useUpdateArcCategory,
  useDeactivateArcCategory,
} from '../../hooks/useArcRequests';
import type { ArcCategory } from '../../types/api';

const ArcCategoryManagementPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { categories, isLoading } = useArcCategories(true);
  const createCategory = useCreateArcCategory();
  const updateCategory = useUpdateArcCategory();
  const deactivateCategory = useDeactivateArcCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ArcCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0 });
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; category: ArcCategory | null }>({
    open: false,
    category: null,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', sort_order: categories.length });
    setDialogOpen(true);
  };

  const openEdit = (cat: ArcCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? '', sort_order: cat.sort_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, data: form });
        enqueueSnackbar('Category updated successfully', { variant: 'success' });
      } else {
        await createCategory.mutateAsync(form);
        enqueueSnackbar('Category created successfully', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      enqueueSnackbar('Something went wrong. Please try again.', { variant: 'error' });
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateDialog.category) return;
    try {
      await deactivateCategory.mutateAsync(deactivateDialog.category.id);
      enqueueSnackbar(`"${deactivateDialog.category.name}" has been deactivated.`, { variant: 'success' });
      setDeactivateDialog({ open: false, category: null });
    } catch {
      enqueueSnackbar('Could not deactivate this category.', { variant: 'error' });
    }
  };

  const activeCategories = categories.filter((c) => c.is_active);
  const inactiveCategories = categories.filter((c) => !c.is_active);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Request Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Categories appear in the dropdown when homeowners submit a new review request.
            Deactivated categories won't show up for new submissions but existing requests are not affected.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ flexShrink: 0, ml: 2 }}>
          New Category
        </Button>
      </Box>

      {!isLoading && categories.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Category sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Categories Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Create categories so homeowners can classify their requests (e.g. Fence, Paint, Landscaping).
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Create First Category
          </Button>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Display Order</TableCell>
                  <TableCell sx={{ width: 100 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : [...activeCategories, ...inactiveCategories].map((cat) => (
                      <TableRow key={cat.id} sx={{ opacity: cat.is_active ? 1 : 0.55 }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {cat.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {cat.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cat.is_active ? 'Active' : 'Inactive'}
                            color={cat.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{cat.sort_order}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit category">
                            <IconButton size="small" onClick={() => openEdit(cat)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {cat.is_active && (
                            <Tooltip title="Deactivate category">
                              <IconButton
                                size="small"
                                onClick={() => setDeactivateDialog({ open: true, category: cat })}
                              >
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Edit "${editing.name}"` : 'Create a New Category'}</DialogTitle>
        <DialogContent>
          {!editing && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A category helps homeowners describe the type of change they're requesting.
            </Typography>
          )}
          <TextField
            fullWidth
            label="Category Name"
            placeholder="e.g. Fence, Solar Panels, Landscaping"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
            helperText="Keep it short and clear. This is what homeowners will see in the dropdown."
          />
          <TextField
            fullWidth
            label="Description"
            placeholder="e.g. New fence installation or changes to an existing fence"
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Optional. Helps homeowners pick the right category."
          />
          <TextField
            fullWidth
            type="number"
            label="Display Order"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            helperText="Lower numbers appear first in the dropdown. Use 0, 1, 2, 3... to control the order."
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            {editing ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Confirmation */}
      <Dialog
        open={deactivateDialog.open}
        onClose={() => setDeactivateDialog({ open: false, category: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Deactivate Category?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate <strong>{deactivateDialog.category?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Homeowners won't be able to select this category for new requests.
            Existing requests using this category are not affected.
            You can reactivate it later by editing the category.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeactivateDialog({ open: false, category: null })}>Keep Active</Button>
          <Button variant="contained" color="error" onClick={confirmDeactivate}>
            Yes, Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArcCategoryManagementPage;
