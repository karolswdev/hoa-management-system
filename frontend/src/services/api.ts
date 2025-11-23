import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  User,
  Announcement,
  Event,
  Document,
  Discussion,
  Config,
  AuditLog,
  PaginatedResponse,
  DocumentsResponse,
  DiscussionThreadResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CreateAnnouncementRequest,
  CreateEventRequest,
  UpdateEventRequest,
  CreateDiscussionRequest,
  CreateReplyRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  UpdateConfigRequest,
  BoardMember,
  BoardHistoryItem,
  BoardConfig,
  BoardContactRequest,
  Poll,
  SubmitVoteRequest,
  VoteResponse,
  VoteReceipt,
  CreatePollRequest,
  Vendor,
  VendorFilter,
  VendorsResponse,
  CreateVendorRequest,
  UpdateVendorRequest,
} from '../types/api';

class ApiService {
  private api: AxiosInstance;
  private showError?: (message: string) => void;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Don't auto-redirect on login endpoint 401 errors - let the login page handle them
        const isLoginEndpoint = error.config?.url?.includes('/auth/login');
        
        if (error.response?.status === 401 && !isLoginEndpoint) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else if (error.response?.status >= 500) {
          // Show generic error for server errors
          this.showError?.('An unexpected error occurred. Please try again.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Method to set the error notification handler
  setErrorHandler(showError: (message: string) => void) {
    this.showError = showError;
  }

  // Authentication
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response: AxiosResponse<RegisterResponse> = await this.api.post('/auth/register', data);
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await this.api.post('/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await this.api.post('/auth/reset-password', data);
    return response.data;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await this.api.get(`/auth/verify-email`, { params: { token } });
    return response.data;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/resend-verification', { email });
    return response.data;
  }

  // User Profile
  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/users/me');
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/users/me', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await this.api.put('/users/me/password', data);
    return response.data;
  }

  // Announcements
  async getAnnouncements(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<Announcement>> {
    const response: AxiosResponse<PaginatedResponse<Announcement>> = await this.api.get('/announcements', { params });
    return response.data;
  }

  async createAnnouncement(data: CreateAnnouncementRequest): Promise<Announcement> {
    const response: AxiosResponse<Announcement> = await this.api.post('/announcements', data);
    return response.data;
  }

  async updateAnnouncement(id: number, data: Partial<CreateAnnouncementRequest>): Promise<Announcement> {
    const response: AxiosResponse<Announcement> = await this.api.put(`/announcements/${id}`, data);
    return response.data;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await this.api.delete(`/announcements/${id}`);
  }

  // Events
  async getEvents(params?: {
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<Event>> {
    const response: AxiosResponse<PaginatedResponse<Event>> = await this.api.get('/events', { params });
    
    // Backend returns event_date, but we need start_date for consistency
    const transformedData = response.data.data.map(event => ({
      ...event,
      start_date: event.event_date, // Map event_date to start_date
    }));
    
    return {
      ...response.data,
      data: transformedData,
    };
  }

  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response: AxiosResponse<Event> = await this.api.post('/events', data);
    // Backend returns event_date, map it to start_date for consistency
    return {
      ...response.data,
      start_date: response.data.event_date,
    };
  }

  async updateEvent(id: number, data: UpdateEventRequest): Promise<Event> {
    const response: AxiosResponse<Event> = await this.api.put(`/events/${id}`, data);
    // Backend returns event_date, map it to start_date for consistency
    return {
      ...response.data,
      start_date: response.data.event_date,
    };
  }

  async deleteEvent(id: number): Promise<void> {
    await this.api.delete(`/events/${id}`);
  }

  // Documents
  async getDocuments(params?: { limit?: number; offset?: number }): Promise<DocumentsResponse> {
    const response: AxiosResponse<DocumentsResponse> = await this.api.get('/documents', { params });
    return response.data;
  }

  async getDocument(id: number): Promise<Document> {
    const response: AxiosResponse<Document> = await this.api.get(`/documents/${id}`);
    return response.data;
  }

  async downloadDocument(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async uploadDocument(formData: FormData): Promise<{ message: string; document: Document }> {
    const response = await this.api.post('/admin/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async approveDocument(id: number): Promise<Document> {
    const response: AxiosResponse<Document> = await this.api.put(`/admin/documents/${id}/approve`);
    return response.data;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.api.delete(`/admin/documents/${id}`);
  }

  // Discussions
  async getDiscussions(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Discussion>> {
    const response = await this.api.get('/discussions', { params });
    
    // Backend returns { totalItems, totalPages, currentPage, threads }
    // Convert to expected PaginatedResponse format
    return {
      data: response.data.threads || [],
      pagination: {
        totalItems: response.data.totalItems || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || 1,
        limit: params?.limit || 10,
      }
    };
  }

  async createDiscussion(data: CreateDiscussionRequest): Promise<Discussion> {
    const response: AxiosResponse<Discussion> = await this.api.post('/discussions', data);
    return response.data;
  }

  async getDiscussionThread(id: number): Promise<DiscussionThreadResponse> {
    const response: AxiosResponse<DiscussionThreadResponse> = await this.api.get(`/discussions/${id}`);
    return response.data;
  }

  async createReply(threadId: number, data: CreateReplyRequest): Promise<Discussion> {
    const response: AxiosResponse<Discussion> = await this.api.post(`/discussions/${threadId}/replies`, data);
    return response.data;
  }

  async deleteDiscussion(id: number): Promise<void> {
    await this.api.delete(`/discussions/${id}`);
  }

  async deleteReply(id: number): Promise<void> {
    await this.api.delete(`/discussions/replies/${id}`);
  }

  // Admin - User Management
  async getUsers(params?: { limit?: number; offset?: number }): Promise<{ count: number; users: User[] }> {
    const response = await this.api.get('/admin/users', { params });
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/admin/users/${id}`);
    return response.data;
  }

  async updateUserStatus(id: number, data: UpdateUserStatusRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put(`/admin/users/${id}/status`, data);
    return response.data;
  }

  async updateUserRole(id: number, data: UpdateUserRoleRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put(`/admin/users/${id}/role`, data);
    return response.data;
  }

  async updateUserPassword(id: number, data: { newPassword: string }): Promise<{ message: string }> {
    const response = await this.api.put(`/admin/users/${id}/password`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/admin/users/${id}`);
  }

  // Admin - Site Configuration
  async getConfig(): Promise<Config> {
    const response: AxiosResponse<Config> = await this.api.get('/admin/config');
    return response.data;
  }

  async updateConfig(key: string, data: UpdateConfigRequest): Promise<{ message: string }> {
    const response = await this.api.put(`/admin/config/${key}`, data);
    return response.data;
  }

  // Admin - Audit Logs
  async getAuditLogs(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<AuditLog>> {
    const response: AxiosResponse<PaginatedResponse<AuditLog>> = await this.api.get('/admin/audit-logs', { params });
    return response.data;
  }

  // Board
  async getBoardRoster(): Promise<{ members: BoardMember[]; lastFetched: string }> {
    const response = await this.api.get('/board/roster');
    return {
      members: response.data.members || response.data,
      lastFetched: new Date().toISOString(),
    };
  }

  async getBoardHistory(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<BoardHistoryItem>> {
    const response: AxiosResponse<PaginatedResponse<BoardHistoryItem>> = await this.api.get('/board/history', { params });
    return response.data;
  }

  async getBoardConfig(): Promise<BoardConfig> {
    const response: AxiosResponse<BoardConfig> = await this.api.get('/board/config');
    return response.data;
  }

  async submitBoardContact(data: BoardContactRequest): Promise<{ message: string }> {
    const response = await this.api.post('/board/contact', data);
    return response.data;
  }

  // Polls
  async getPolls(params?: {
    type?: 'informal' | 'binding';
    status?: 'draft' | 'active' | 'closed';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Poll>> {
    const response: AxiosResponse<PaginatedResponse<Poll>> = await this.api.get('/polls', { params });
    return response.data;
  }

  async getPoll(id: number): Promise<Poll> {
    const response: AxiosResponse<Poll> = await this.api.get(`/polls/${id}`);
    return response.data;
  }

  async submitVote(pollId: number, data: SubmitVoteRequest): Promise<VoteResponse> {
    const response: AxiosResponse<VoteResponse> = await this.api.post(`/polls/${pollId}/votes`, data);
    return response.data;
  }

  async getReceipt(pollId: number, hash: string): Promise<VoteReceipt> {
    const response: AxiosResponse<VoteReceipt> = await this.api.get(`/polls/${pollId}/receipts/${hash}`);
    return response.data;
  }

  async createPoll(data: CreatePollRequest): Promise<Poll> {
    const response: AxiosResponse<Poll> = await this.api.post('/admin/polls', data);
    return response.data;
  }

  async updatePoll(id: number, data: Partial<CreatePollRequest>): Promise<Poll> {
    const response: AxiosResponse<Poll> = await this.api.put(`/admin/polls/${id}`, data);
    return response.data;
  }

  async deletePoll(id: number): Promise<void> {
    await this.api.delete(`/admin/polls/${id}`);
  }

  // Vendors
  async getVendors(params?: VendorFilter): Promise<VendorsResponse> {
    const response: AxiosResponse<VendorsResponse> = await this.api.get('/vendors', { params });
    return response.data;
  }

  async getVendor(id: number): Promise<Vendor> {
    const response: AxiosResponse<{ vendor: Vendor }> = await this.api.get(`/vendors/${id}`);
    return response.data.vendor;
  }

  async createVendor(data: CreateVendorRequest): Promise<{ message: string; vendor: Vendor }> {
    const response = await this.api.post('/vendors', data);
    return response.data;
  }

  async updateVendor(id: number, data: UpdateVendorRequest): Promise<Vendor> {
    const response: AxiosResponse<{ message: string; vendor: Vendor }> = await this.api.put(`/vendors/${id}`, data);
    return response.data.vendor;
  }

  async deleteVendor(id: number): Promise<void> {
    await this.api.delete(`/vendors/${id}`);
  }
}

export const apiService = new ApiService();
