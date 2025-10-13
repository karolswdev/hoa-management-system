// API Data Models based on the HOA Management API

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'member' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  email_verified: boolean;
  is_system_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_by: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
  };
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  location: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
  };
  // Backend returns event_date but we also need start_date for consistency
  start_date: string;
}

export interface Document {
  id: number;
  title: string;
  description: string | null;
  file_name: string;
  original_file_name: string;
  file_path: string;
  uploaded_by: number;
  approved: boolean;
  is_public: boolean;
  uploaded_at: string;
  updated_at: string;
  uploader?: {
    id: number;
    name: string;
  };
}

export interface Discussion {
  id: number;
  title: string | null;
  content: string;
  user_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: number;
    name: string;
  };
  reply_count?: number;
}

export interface Config {
  [key: string]: string;
}

export interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  details: object;
  created_at: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface DocumentsResponse {
  count: number;
  documents: Document[];
}

export interface DiscussionThreadResponse {
  mainThread: Discussion;
  replies: Discussion[];
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  // Optional captcha token (e.g., Turnstile)
  captchaToken?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Form Types
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  expiresAt?: string;
  notify?: boolean;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  event_date: string;
  location: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
}

export interface CreateDiscussionRequest {
  title: string;
  content: string;
}

export interface CreateReplyRequest {
  content: string;
}

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserStatusRequest {
  status: 'approved' | 'pending' | 'rejected';
}

export interface UpdateUserRoleRequest {
  role: 'admin' | 'member';
}

export interface UpdateConfigRequest {
  value: string;
}

// Error Response
export interface ApiError {
  message: string;
  error?: string;
}
