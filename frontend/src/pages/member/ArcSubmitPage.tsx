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
  Alert,
  ListItemText,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useArcCategories, useCreateArcRequest } from '../../hooks/useArcRequests';

const validationSchema = Yup.object({
  property_address: Yup.string().required('Please enter the property address where the work will happen.'),
  category_id: Yup.number().required('Please select a category.').min(1, 'Please select a category.'),
  description: Yup.string()
    .required('Please describe the proposed change.')
    .min(20, 'Please provide more detail — at least a couple of sentences so the committee can understand your plan.'),
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
        enqueueSnackbar('Your request has been submitted! The committee will review it shortly.', { variant: 'success' });
        navigate(`/arc/${result.arcRequest.id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        enqueueSnackbar(message, { variant: 'error' });
      }
    },
  });

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" variant="body2" underline="hover" onClick={() => navigate('/arc')}>
          My Requests
        </Link>
        <Typography variant="body2" color="text.primary">
          New Request
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" gutterBottom>
        Submit a Review Request
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
        Tell us about the change you'd like to make. The review committee will look at your
        request and respond, usually within a few business days. You can add photos and
        documents after submitting.
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            label="Property Address"
            name="property_address"
            placeholder="e.g. 123 Oak Lane"
            value={formik.values.property_address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.property_address && Boolean(formik.errors.property_address)}
            helperText={
              (formik.touched.property_address && formik.errors.property_address) ||
              'The address where the change will take place.'
            }
            sx={{ mb: 2.5 }}
          />

          <TextField
            fullWidth
            select
            label="What type of change?"
            name="category_id"
            value={formik.values.category_id || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.category_id && Boolean(formik.errors.category_id)}
            helperText={
              (formik.touched.category_id && formik.errors.category_id) ||
              'Pick the option that best describes your project.'
            }
            disabled={categoriesLoading}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="" disabled>
              Select a category...
            </MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                <ListItemText
                  primary={cat.name}
                  secondary={cat.description}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={5}
            label="Describe your project"
            name="description"
            placeholder="What are you planning to do? Include details like materials, colors, dimensions, and timeline so the committee has everything they need."
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={
              (formik.touched.description && formik.errors.description) ||
              'The more detail you provide, the faster the committee can review your request.'
            }
            sx={{ mb: 3 }}
          />

          <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
            <Typography variant="body2">
              After submitting, you'll be able to upload photos, plans, or other supporting
              documents from the request detail page.
            </Typography>
          </Alert>

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
              {isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ArcSubmitPage;
