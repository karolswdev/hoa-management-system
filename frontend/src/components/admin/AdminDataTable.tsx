import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Block as BlockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

export interface TableColumn<T = any> {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableAction<T = any> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: (row: T) => void;
  show?: (row: T) => boolean;
}

export interface AdminDataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  totalItems?: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  actions?: TableAction<T>[];
  emptyMessage?: string;
  title?: string;
}

const AdminDataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  error = null,
  totalItems = 0,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection = 'asc',
  actions = [],
  emptyMessage = 'No data available',
  title,
}: AdminDataTableProps<T>) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = React.useState<T | null>(null);

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, row: T) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleSort = (columnId: string) => {
    if (!onSort) return;
    
    const isCurrentColumn = sortColumn === columnId;
    const newDirection = isCurrentColumn && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnId, newDirection);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderCellValue = (column: TableColumn<T>, row: T) => {
    const value = row[column.id];
    
    if (column.render) {
      return column.render(value, row);
    }

    // Default rendering for common data types
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Yes' : 'No'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      );
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === 'string' && value.length > 50) {
      return `${value.substring(0, 50)}...`;
    }

    return String(value);
  };

  const visibleActions = actions.filter(action => 
    !selectedRow || !action.show || action.show(selectedRow)
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {title}
        </Typography>
      )}
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ width: column.width }}
                  sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}
                >
                  {column.sortable && onSort ? (
                    <TableSortLabel
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)} 
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={row.id || index} hover>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                    >
                      {renderCellValue(column, row)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionClick(e, row)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {visibleActions.map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => {
              if (selectedRow) {
                action.onClick(selectedRow);
              }
              handleActionClose();
            }}
          >
            {action.icon && (
              <ListItemIcon>
                {action.icon}
              </ListItemIcon>
            )}
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Summary */}
      {totalItems > 0 && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary" align="center">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AdminDataTable;