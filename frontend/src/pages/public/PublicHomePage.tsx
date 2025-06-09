import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Description as DocumentIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import type { Document, DocumentsResponse } from '../../types/api';

const PublicHomePage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load public documents
  const loadPublicDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the documents API without authentication to get public documents
      const response: DocumentsResponse = await apiService.getDocuments({
        limit: 20, // Show up to 20 public documents
        offset: 0,
      });
      
      setDocuments(response.documents);
    } catch (err: any) {
      setError('Failed to load public documents');
      console.error('Error loading public documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicDocuments();
  }, []);

  // Handle document download
  const handleDownloadDocument = async (document: Document) => {
    try {
      const blob = await apiService.downloadDocument(document.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download document:', err);
    }
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header Section */}
        <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <HomeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" gutterBottom color="primary">
            Welcome to Our Community
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Homeowners Association Information Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Access public documents and information about our community. 
            For full access to announcements, events, and discussions, please log in to your member account.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              href="/login"
              sx={{ mr: 2 }}
            >
              Member Login
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              href="/register"
            >
              Register
            </Button>
          </Box>
        </Paper>

        {/* Public Documents Section */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" color="primary">
              Public Documents
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The following documents are available for public access:
          </Typography>

          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && documents.length === 0 && (
            <Alert severity="info">
              No public documents are currently available.
            </Alert>
          )}

          {!loading && !error && documents.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
              {documents.map((document) => (
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} key={document.id}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="flex-start" mb={2}>
                      <DocumentIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />
                      <Box flexGrow={1}>
                        <Typography variant="h6" gutterBottom>
                          {document.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {document.original_file_name}
                        </Typography>
                      </Box>
                    </Box>

                    {document.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {document.description.length > 150 
                          ? `${document.description.substring(0, 150)}...` 
                          : document.description
                        }
                      </Typography>
                    )}

                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                      <Chip 
                        label="Public" 
                        color="primary" 
                        size="small" 
                      />
                      {document.approved && (
                        <Chip 
                          label="Approved" 
                          color="success" 
                          size="small" 
                        />
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadDocument(document)}
                      >
                        Download
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Footer Information */}
        <Paper elevation={1} sx={{ p: 3, mt: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            For questions about these documents or to access additional community resources, 
            please contact your HOA administrator or log in to your member account.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default PublicHomePage;