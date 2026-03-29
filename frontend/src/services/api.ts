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
  CodeOfConductAcceptance,
  Committee,
  CommitteeMembership,
  CreateCommitteeRequest,
  UpdateCommitteeRequest,
  AddCommitteeMemberRequest,
  WorkflowInstance,
  WorkflowListResponse,
  WorkflowTransitionRequest,
  WorkflowTransition,
  WorkflowComment,
  WorkflowCommentRequest,
  WorkflowAttachment,
  ArcRequest,
  ArcRequestListResponse,
  ArcRequestCreateResponse,
  CreateArcRequestRequest,
  UpdateArcRequestRequest,
  ArcCategory,
  CreateArcCategoryRequest,
  UpdateArcCategoryRequest,
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

  // Public - Community Configuration (read-only for all users)
  async getCommunityConfig(): Promise<Config> {
    const response: AxiosResponse<Config> = await this.api.get('/config');
    return response.data;
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
    const response = await this.api.get(`/polls/${pollId}/receipts/${hash}`);
    const { receipt } = response.data;
    return {
      vote_hash: receipt.vote_hash,
      poll_id: receipt.poll.id,
      poll_title: receipt.poll.title,
      option_text: receipt.option.text,
      timestamp: receipt.timestamp,
      verified: true,
    };
  }

  async createPoll(data: CreatePollRequest): Promise<Poll> {
    const response: AxiosResponse<Poll> = await this.api.post('/polls', data);
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

  async moderateVendor(id: number, moderation_state: 'pending' | 'approved' | 'denied'): Promise<Vendor> {
    const response: AxiosResponse<{ message: string; vendor: Vendor }> = await this.api.patch(`/vendors/${id}/moderate`, { moderation_state });
    return response.data.vendor;
  }

  async getVendorStats(): Promise<{ stats: { byModerationState: Array<{ state: string; count: number }>; byCategory: Array<{ category: string; count: number }> } }> {
    const response = await this.api.get('/vendors/stats');
    return response.data;
  }

  // Code of Conduct
  async getCodeOfConductAcceptance(): Promise<CodeOfConductAcceptance> {
    const response: AxiosResponse<CodeOfConductAcceptance> = await this.api.get('/discussions/code-of-conduct/acceptance');
    return response.data;
  }

  async acceptCodeOfConduct(version: string): Promise<{ message: string; acceptance: CodeOfConductAcceptance }> {
    const response = await this.api.post('/discussions/code-of-conduct/accept', { version });
    return response.data;
  }

  // Committees
  async getCommittees(params?: { includeInactive?: boolean }): Promise<{ committees: Committee[] }> {
    const response = await this.api.get('/committees', {
      params: params?.includeInactive ? { includeInactive: 'true' } : undefined,
    });
    return response.data;
  }

  async getCommittee(id: number): Promise<Committee> {
    const response: AxiosResponse<Committee> = await this.api.get(`/committees/${id}`);
    return response.data;
  }

  async createCommittee(data: CreateCommitteeRequest): Promise<Committee> {
    const response: AxiosResponse<Committee> = await this.api.post('/committees', data);
    return response.data;
  }

  async updateCommittee(id: number, data: UpdateCommitteeRequest): Promise<Committee> {
    const response: AxiosResponse<Committee> = await this.api.put(`/committees/${id}`, data);
    return response.data;
  }

  async deactivateCommittee(id: number): Promise<{ message: string }> {
    const response = await this.api.delete(`/committees/${id}`);
    return response.data;
  }

  async addCommitteeMember(committeeId: number, data: AddCommitteeMemberRequest): Promise<{ membership: CommitteeMembership }> {
    const response = await this.api.post(`/committees/${committeeId}/members`, data);
    return response.data;
  }

  async removeCommitteeMember(committeeId: number, userId: number): Promise<{ message: string }> {
    const response = await this.api.delete(`/committees/${committeeId}/members/${userId}`);
    return response.data;
  }

  // Workflows
  async getWorkflows(params?: { status?: string; page?: number; limit?: number }): Promise<WorkflowListResponse> {
    const response = await this.api.get('/workflows', { params });
    const raw = response.data;
    return {
      workflows: raw.workflows ?? raw.data ?? [],
      pagination: raw.pagination,
    };
  }

  async getWorkflow(id: number): Promise<WorkflowInstance> {
    const response: AxiosResponse<WorkflowInstance> = await this.api.get(`/workflows/${id}`);
    return response.data;
  }

  async performTransition(workflowId: number, data: WorkflowTransitionRequest): Promise<{ workflow: WorkflowInstance; transition: WorkflowTransition }> {
    const response = await this.api.post(`/workflows/${workflowId}/transitions`, data);
    return response.data;
  }

  async addWorkflowComment(workflowId: number, data: WorkflowCommentRequest): Promise<{ comment: WorkflowComment }> {
    const response = await this.api.post(`/workflows/${workflowId}/comments`, data);
    return response.data;
  }

  async uploadWorkflowAttachments(workflowId: number, files: File[]): Promise<{ attachments: WorkflowAttachment[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await this.api.post(`/workflows/${workflowId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async downloadWorkflowAttachment(workflowId: number, attachmentId: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(
      `/workflows/${workflowId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // ARC Requests
  async getArcRequests(params?: { status?: string; page?: number; limit?: number }): Promise<ArcRequestListResponse> {
    const response = await this.api.get('/arc-requests', { params });
    const raw = response.data;
    const items = raw.arcRequests ?? raw.data ?? [];
    // Enrich items with created_at from workflow if missing at top level
    const enriched = items.map((item: ArcRequest & { workflow?: { created_at?: string } }) => ({
      ...item,
      created_at: item.created_at ?? item.workflow?.created_at ?? new Date().toISOString(),
      updated_at: item.updated_at ?? item.created_at ?? new Date().toISOString(),
    }));
    return {
      arcRequests: enriched,
      pagination: raw.pagination,
    };
  }

  async getArcRequest(id: number): Promise<{ arcRequest: ArcRequest }> {
    const response = await this.api.get(`/arc-requests/${id}`);
    return response.data;
  }

  async createArcRequest(data: CreateArcRequestRequest): Promise<ArcRequestCreateResponse> {
    const response: AxiosResponse<ArcRequestCreateResponse> = await this.api.post('/arc-requests', data);
    return response.data;
  }

  async updateArcRequest(id: number, data: UpdateArcRequestRequest): Promise<{ arcRequest: ArcRequest }> {
    const response = await this.api.put(`/arc-requests/${id}`, data);
    return response.data;
  }

  // ARC Categories
  async getArcCategories(params?: { includeInactive?: boolean }): Promise<{ categories: ArcCategory[] }> {
    const response = await this.api.get('/arc-categories', {
      params: params?.includeInactive ? { includeInactive: 'true' } : undefined,
    });
    return response.data;
  }

  async createArcCategory(data: CreateArcCategoryRequest): Promise<ArcCategory> {
    const response: AxiosResponse<ArcCategory> = await this.api.post('/arc-categories', data);
    return response.data;
  }

  async updateArcCategory(id: number, data: UpdateArcCategoryRequest): Promise<ArcCategory> {
    const response: AxiosResponse<ArcCategory> = await this.api.put(`/arc-categories/${id}`, data);
    return response.data;
  }

  async deactivateArcCategory(id: number): Promise<{ message: string }> {
    const response = await this.api.delete(`/arc-categories/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
