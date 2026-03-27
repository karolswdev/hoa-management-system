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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
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

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', sort_order: 0 });
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
        enqueueSnackbar('Category updated', { variant: 'success' });
      } else {
        await createCategory.mutateAsync(form);
        enqueueSnackbar('Category created', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateCategory.mutateAsync(id);
      enqueueSnackbar('Category deactivated', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to deactivate', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">ARC Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Create Category
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sort Order</TableCell>
              <TableCell>Actions</TableCell>
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
              : categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.description ?? '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={cat.is_active ? 'Active' : 'Inactive'}
                        color={cat.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{cat.sort_order}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEdit(cat)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      {cat.is_active && (
                        <IconButton size="small" onClick={() => handleDeactivate(cat.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Category' : 'Create Category'}</DialogTitle>
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
            label="Sort Order"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArcCategoryManagementPage;
