
export enum GroupStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string; 
  major?: string;
  bio?: string;
  avatar?: string;
  token?: string; 
  location?: string; 
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  faculty: string;
  description: string;
  max_members: number;
  members_count: number;
  location: string;
  creator_id: string;
  creator_name: string;
  status: GroupStatus;
  created_at: string;
  is_member?: boolean;
  has_pending_request?: boolean;
  pending_requests_count?: number;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  content: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  group_name: string;
  rating: number;
  text: string;
  user_name: string;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  group_id?: string;
  title: string;
  type: string;
  start_time: string;
  location?: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: 'message' | 'group_join' | 'event' | 'join_request' | 'join_approved' | 'join_rejected' | 'removed_from_group';
  data: {
    user_id?: number;
    user_name?: string;
    group_id?: string;
    group_name?: string;
    message: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface PendingJoinRequest {
  id: string;
  name: string;
  email: string;
  major?: string;
  requested_at: string;
}

export interface GroupMember {
  id: number;
  name: string;
  email: string;
  major?: string;
  role: string;
  is_leader: boolean;
  joined_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}