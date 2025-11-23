import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Pagination,
  Chip,
} from '@mui/material';
import { Download, Search, Description, Person, CalendarToday } from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/api';
import type { Document, DocumentsResponse } from '../../types/api';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  const { showError, showSuccess } = useNotification();

  const itemsPerPage = 10;

  const fetchDocuments = async (offset: number = 0) => {
    setLoading(true);
    setError('');
    
    try {
      const response: DocumentsResponse = await apiService.getDocuments({
        limit: itemsPerPage,
        offset,
      });

      setDocuments(response.documents);
      setTotalCount(response.count);
      setFilteredDocuments(response.documents);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to load documents. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(0);
  }, []);

  // Filter documents based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploader?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, documents]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    const offset = (page - 1) * itemsPerPage;
    setCurrentPage(page);
    fetchDocuments(offset);
  };

  const handleDownload = async (doc: Document) => {
    setDownloadingIds(prev => new Set(prev).add(doc.id));
    
    try {
      const blob = await apiService.downloadDocument(doc.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.original_file_name;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      showSuccess(`Downloaded ${doc.title} successfully!`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Failed to download document. Please try again.';
      showError(errorMessage);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Documents
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Documents
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Documents
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search documents by title, description, or uploader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {filteredDocuments.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4, py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No documents found' : 'No documents available'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm 
              ? 'Try adjusting your search terms or clear the search to see all documents.'
              : 'There are currently no documents available for download.'
            }
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm 
              ? `Found ${filteredDocuments.length} documents matching "${searchTerm}"`
              : `Showing ${documents.length} of ${totalCount} documents`
            }
          </Typography>

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Uploader</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description color="action" />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {document.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getFileExtension(document.original_file_name)} • {document.original_file_name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {document.description || 'No description provided'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2">
                          {document.uploader?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDate(document.uploaded_at)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={document.approved ? 'Approved' : 'Pending'}
                          color={document.approved ? 'success' : 'warning'}
                          size="small"
                        />
                        {document.is_public && (
                          <Chip 
                            label="Public"
                            color="info"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={() => handleDownload(document)}
                        disabled={downloadingIds.has(document.id)}
                      >
                        {downloadingIds.has(document.id) ? 'Downloading...' : 'Download'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {!searchTerm && totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default DocumentsPage;
