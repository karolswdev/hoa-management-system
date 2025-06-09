import { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { apiService } from '../services/api';

export const useApiNotifications = () => {
  const { showError } = useNotification();

  useEffect(() => {
    // Set the error handler for the API service
    apiService.setErrorHandler(showError);
  }, [showError]);
};