import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminDataTable, { type TableColumn, type TableAction } from '../../components/admin/AdminDataTable';
import { apiService } from '../../services/api';
import type { User, UpdateUserStatusRequest, UpdateUserRoleRequest } from '../../types/api';

interface UsersResponse {
  count: number;
  users: User[];
}

const AdminUsersPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State for data
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // State for modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');

  // Load users data
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const response: UsersResponse = await apiService.getUsers({
        limit: itemsPerPage,
        offset,
      });
      
      // Filter out system users and apply search/filters
      let filteredUsers = response.users.filter(user => !user.is_system_user);
      
      // Apply search filter
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
      }
      
      // Apply role filter
      if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
      }
      
      setUsers(filteredUsers);
      setTotalUsers(filteredUsers.length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      enqueueSnackbar('Failed to load users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, statusFilter, roleFilter]);

  // Handle user status update
  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    
    try {
      const data: UpdateUserStatusRequest = { status: newStatus };
      await apiService.updateUserStatus(selectedUser.id, data);
      
      enqueueSnackbar(`User status updated to ${newStatus}`, { variant: 'success' });
      setStatusModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update user status', { variant: 'error' });
    }
  };

  // Handle user role update
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    try {
      const data: UpdateUserRoleRequest = { role: newRole };
      await apiService.updateUserRole(selectedUser.id, data);
      
      enqueueSnackbar(`User role updated to ${newRole}`, { variant: 'success' });
      setRoleModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update user role', { variant: 'error' });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiService.deleteUser(selectedUser.id);
      
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      setDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete user', { variant: 'error' });
    }
  };

  // Define table columns
  const columns: TableColumn<User>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string, user: User) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      align: 'center',
      render: (value: string) => (
        <Chip
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          color={value === 'admin' ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (value: string) => (
        <Chip
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          color={
            value === 'approved' ? 'success' :
            value === 'pending' ? 'warning' : 'error'
          }
          size="small"
        />
      ),
    },
    {
      id: 'email_verified',
      label: 'Email Verified',
      align: 'center',
      render: (value: boolean) => (
        <Chip
          label={value ? 'Yes' : 'No'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'created_at',
      label: 'Joined Date',
      align: 'center',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Define table actions
  const actions: TableAction<User>[] = [
    {
      id: 'update-status',
      label: 'Update Status',
      icon: <EditIcon />,
      color: 'primary',
      onClick: (user: User) => {
        setSelectedUser(user);
        setNewStatus(user.status);
        setStatusModalOpen(true);
      },
    },
    {
      id: 'update-role',
      label: 'Update Role',
      icon: <PersonIcon />,
      color: 'secondary',
      onClick: (user: User) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setRoleModalOpen(true);
      },
    },
    {
      id: 'delete',
      label: 'Delete User',
      icon: <DeleteIcon />,
      color: 'error',
      onClick: (user: User) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage user accounts, roles, and permissions
      </Typography>

      {/* Search and Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search users"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 250 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setRoleFilter('all');
            setCurrentPage(1);
          }}
        >
          Clear Filters
        </Button>
      </Box>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        totalItems={totalUsers}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        actions={actions}
        emptyMessage="No users found"
      />

      {/* Update Status Modal */}
      <Dialog open={statusModalOpen} onClose={() => setStatusModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update User Status</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Update status for <strong>{selectedUser.name}</strong> ({selectedUser.email})
              </Typography>
              
              <FormControl component="fieldset">
                <RadioGroup
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'pending' | 'approved' | 'rejected')}
                >
                  <FormControlLabel value="approved" control={<Radio />} label="Approved" />
                  <FormControlLabel value="pending" control={<Radio />} label="Pending" />
                  <FormControlLabel value="rejected" control={<Radio />} label="Rejected" />
                </RadioGroup>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusModalOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Role Modal */}
      <Dialog open={roleModalOpen} onClose={() => setRoleModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Update role for <strong>{selectedUser.name}</strong> ({selectedUser.email})
              </Typography>
              
              <FormControl component="fieldset">
                <RadioGroup
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}
                >
                  <FormControlLabel value="member" control={<Radio />} label="Member" />
                  <FormControlLabel value="admin" control={<Radio />} label="Admin" />
                </RadioGroup>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleModalOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained" color="primary">
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This action cannot be undone. The user will be permanently deleted.
              </Alert>
              
              <Typography variant="body1">
                Are you sure you want to delete <strong>{selectedUser.name}</strong> ({selectedUser.email})?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersPage;
