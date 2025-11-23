import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminDataTable, { type TableColumn } from '../../components/admin/AdminDataTable';
import { apiService } from '../../services/api';
import type { AuditLog, PaginatedResponse } from '../../types/api';

const AdminAuditPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State for data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  
  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  
  // Available action types for filtering
  const actionTypes = [
    'all',
    'user_created',
    'user_updated',
    'user_deleted',
    'announcement_created',
    'announcement_updated',
    'announcement_deleted',
    'event_created',
    'event_updated',
    'event_deleted',
    'document_uploaded',
    'document_approved',
    'document_deleted',
    'config_updated',
    'login',
    'logout',
  ];

  // Load audit logs data
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedResponse<AuditLog> = await apiService.getAuditLogs({
        page: currentPage,
        limit: itemsPerPage,
      });
      
      // Apply client-side filtering since the API might not support all filters
      let filteredLogs = response.data;
      
      // Apply search filter
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log =>
          log.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply action filter
      if (actionFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
      }
      
      setAuditLogs(filteredLogs);
      setTotalItems(response.pagination.totalItems);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to load audit logs';
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [actionFilter, currentPage, itemsPerPage, searchTerm, enqueueSnackbar]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Format JSON details for display
  const formatDetails = (details: object): string => {
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return 'Invalid JSON data';
    }
  };

  // Get action color based on action type
  const getActionColor = (action: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (action.includes('created') || action.includes('uploaded')) return 'success';
    if (action.includes('updated') || action.includes('approved')) return 'info';
    if (action.includes('deleted')) return 'error';
    if (action.includes('login')) return 'primary';
    if (action.includes('logout')) return 'secondary';
    return 'default';
  };

  // Define table columns
  const columns: TableColumn<AuditLog>[] = [
    {
      id: 'created_at',
      label: 'Timestamp',
      sortable: true,
      width: 180,
      render: (value: string) => {
        const date = new Date(value);
        return (
          <Box>
            <Typography variant="body2">
              {date.toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {date.toLocaleTimeString()}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'admin_name',
      label: 'Admin',
      width: 150,
      render: (value: string) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'action',
      label: 'Action',
      width: 200,
      render: (value: string) => (
        <Chip
          label={value.replace(/_/g, ' ').toUpperCase()}
          color={getActionColor(value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'details',
      label: 'Details',
      render: (value: object) => {
        const detailsStr = formatDetails(value);
        const preview = detailsStr.length > 100 ? `${detailsStr.substring(0, 100)}...` : detailsStr;
        
        return (
          <Accordion elevation={0} sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                minHeight: 'auto',
                '& .MuiAccordionSummary-content': { margin: '8px 0' }
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {preview}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Full Details:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 300,
                      overflow: 'auto',
                      backgroundColor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    {detailsStr}
                  </Box>
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        );
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Audit Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View system activity and administrative actions
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAuditLogs}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search logs"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 300 }}
          placeholder="Search by admin name, action, or details..."
        />
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Action Type</InputLabel>
          <Select
            value={actionFilter}
            label="Action Type"
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {actionTypes.map((action) => (
              <MenuItem key={action} value={action}>
                {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ').toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          onClick={() => {
            setSearchTerm('');
            setActionFilter('all');
            setCurrentPage(1);
          }}
        >
          Clear Filters
        </Button>
      </Box>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={auditLogs}
        loading={loading}
        error={error}
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        emptyMessage="No audit logs found"
      />

      {/* Summary Information */}
      {auditLogs.length > 0 && (
        <Box mt={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  label={`Total Logs: ${totalItems}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Filtered Results: ${auditLogs.length}`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={`Current Page: ${currentPage}`}
                  color="default"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AdminAuditPage;
