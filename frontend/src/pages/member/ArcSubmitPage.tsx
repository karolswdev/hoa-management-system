import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Breadcrumbs,
  Link,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useArcCategories, useCreateArcRequest } from '../../hooks/useArcRequests';

const validationSchema = Yup.object({
  property_address: Yup.string().required('Property address is required'),
  category_id: Yup.number().required('Category is required').min(1, 'Please select a category'),
  description: Yup.string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters'),
});

const ArcSubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { categories, isLoading: categoriesLoading } = useArcCategories();
  const { mutateAsync: createRequest, isPending } = useCreateArcRequest();

  const formik = useFormik({
    initialValues: {
      property_address: '',
      category_id: 0,
      description: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const result = await createRequest({
          property_address: values.property_address,
          category_id: values.category_id,
          description: values.description,
          submit_immediately: true,
        });
        enqueueSnackbar('Request submitted successfully', { variant: 'success' });
        navigate(`/arc/${result.arcRequest.id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to submit request';
        enqueueSnackbar(message, { variant: 'error' });
      }
    },
  });

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          underline="hover"
          onClick={() => navigate('/arc')}
        >
          ARC Requests
        </Link>
        <Typography variant="body2" color="text.primary">
          Submit Request
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 3 }}>
        Submit Architectural Review Request
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            label="Property Address"
            name="property_address"
            value={formik.values.property_address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.property_address && Boolean(formik.errors.property_address)}
            helperText={formik.touched.property_address && formik.errors.property_address}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            select
            label="Category"
            name="category_id"
            value={formik.values.category_id || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.category_id && Boolean(formik.errors.category_id)}
            helperText={formik.touched.category_id && formik.errors.category_id}
            disabled={categoriesLoading}
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>
              Select a category
            </MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Description"
            name="description"
            placeholder="Describe the proposed change in detail..."
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/arc')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isPending}
              startIcon={isPending ? <CircularProgress size={16} /> : undefined}
            >
              Submit Request
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ArcSubmitPage;
