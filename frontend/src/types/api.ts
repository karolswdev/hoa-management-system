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
  discussion_code_of_conduct?: string;
  discussion_code_of_conduct_version?: string;
}

export interface CodeOfConductAcceptance {
  user_id: number;
  version: string;
  accepted_at: string;
  current_version_accepted: boolean;
}

export interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  details: object;
  created_at: string;
}

// Board Types
export interface BoardMember {
  id: number;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  term_start: string;
  term_end: string | null;
  rank: number;
  board_title?: string;
  created_at: string;
  updated_at: string;
}

export interface BoardHistoryItem {
  id: number;
  member_name: string;
  position: string;
  term_start: string;
  term_end: string;
  board_title?: string;
  created_at: string;
}

export interface BoardConfig {
  visibility: 'public' | 'members-only' | 'restricted';
  showContactInfo: boolean;
  historyVisibility: 'public' | 'members-only';
  lastUpdated?: string;
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

export interface BoardContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  captchaToken?: string;
}

// Poll Types
export type PollType = 'informal' | 'binding';
export type PollStatus = 'draft' | 'active' | 'closed';

export interface PollOption {
  id: number;
  poll_id: number;
  option_text: string;
  display_order: number;
  vote_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Poll {
  id: number;
  title: string;
  description: string | null;
  poll_type: PollType;
  status: PollStatus;
  start_time: string;
  end_time: string;
  created_by: number;
  allow_multiple: boolean;
  show_results_before_close: boolean;
  created_at: string;
  updated_at: string;
  options?: PollOption[];
  total_votes?: number;
  user_has_voted?: boolean;
  time_remaining?: number;
}

export interface Vote {
  id: number;
  poll_id: number;
  user_id: number | null;
  option_id: number;
  vote_hash: string | null;
  prev_hash: string | null;
  timestamp: string;
  created_at: string;
}

export interface VoteReceipt {
  vote_hash: string;
  poll_id: number;
  poll_title: string;
  option_text: string;
  timestamp: string;
  verified: boolean;
}

export interface PollFilter {
  type?: PollType;
  status?: PollStatus;
  search?: string;
}

// Poll Request Types
export interface CreatePollRequest {
  title: string;
  description?: string;
  poll_type: PollType;
  start_time: string;
  end_time: string;
  allow_multiple: boolean;
  show_results_before_close: boolean;
  options: string[];
}

export interface SubmitVoteRequest {
  option_ids: number[];
  request_receipt?: boolean;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  receipt?: VoteReceipt;
  vote_hash?: string;
}

// Vendor Types
export type VendorVisibilityScope = 'public' | 'members' | 'admins';
export type VendorModerationState = 'pending' | 'approved' | 'denied';

export interface Vendor {
  id: number;
  name: string;
  service_category: string;
  visibility_scope: VendorVisibilityScope;
  contact_info?: string | null;
  rating?: number | null;
  notes?: string | null;
  moderation_state?: VendorModerationState;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VendorFilter {
  category?: string;
  search?: string;
  status?: VendorModerationState;
}

export interface VendorsResponse {
  vendors: Vendor[];
  count: number;
  filters: {
    category?: string;
    search?: string;
    status?: VendorModerationState;
  };
}

export interface CreateVendorRequest {
  name: string;
  service_category: string;
  contact_info?: string;
  rating?: number;
  notes?: string;
  visibility_scope?: VendorVisibilityScope;
}

export interface UpdateVendorRequest {
  name?: string;
  service_category?: string;
  contact_info?: string;
  rating?: number;
  notes?: string;
  visibility_scope?: VendorVisibilityScope;
  moderation_state?: VendorModerationState;
}

// Error Response
export interface ApiError {
  message: string;
  error?: string;
}
