
import { StudyGroup, Message, Feedback, User, AppNotification } from '../types';
import { API_CONFIG } from '../constants';

const BASE_URL = API_CONFIG.BASE_URL;

const getHeaders = () => {
  const userStr = localStorage.getItem('auth_user');
  let token = '';
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      token = user.token || '';
    } catch (e) {
      console.error("Auth token parse error", e);
    }
  }
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${res.status}`);
  }
  return res.json();
};

export const apiService = {
  // Authentication
  async login(credentials: any): Promise<{user: User, token: string}> {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },

  async register(data: any): Promise<{user: User, token: string}> {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Groups
  async getGroups(): Promise<StudyGroup[]> {
    const res = await fetch(`${BASE_URL}/groups`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createGroup(data: any): Promise<StudyGroup> {
    const res = await fetch(`${BASE_URL}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateGroup(id: string, data: any): Promise<StudyGroup> {
    const res = await fetch(`${BASE_URL}/groups/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async joinGroup(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/groups/${id}/join`, {
      method: 'POST',
      headers: getHeaders()
    });
    await handleResponse(res);
  },

  async leaveGroup(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/groups/${id}/leave`, {
      method: 'POST',
      headers: getHeaders()
    });
    await handleResponse(res);
  },

  // Messages
  async getMessages(groupId: string): Promise<Message[]> {
    const res = await fetch(`${BASE_URL}/groups/${groupId}/messages`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async sendMessage(groupId: string, content: string): Promise<Message> {
    const res = await fetch(`${BASE_URL}/groups/${groupId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    return handleResponse(res);
  },

  // Discover
  async getTrendingGroups(): Promise<StudyGroup[]> {
    const res = await fetch(`${BASE_URL}/discover/trending`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getSubjects(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/discover/subjects`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getLeaders(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/discover/leaders`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async searchUsers(query: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/discover/users/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Feedback
  async getFeedback(): Promise<Feedback[]> {
    const res = await fetch(`${BASE_URL}/feedback`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async submitFeedback(data: any): Promise<Feedback> {
    const res = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Calendar
  async getEvents(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/calendar/events`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createEvent(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/calendar/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteEvent(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/calendar/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    await handleResponse(res);
  },

  // Profile
  async getProfile(): Promise<User> {
    const res = await fetch(`${BASE_URL}/profile`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getProfileStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/profile/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateProfile(data: any): Promise<User> {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch(`${BASE_URL}/notifications`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const res = await fetch(`${BASE_URL}/notifications/unread-count`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async markNotificationsAsRead(): Promise<void> {
    const res = await fetch(`${BASE_URL}/notifications/mark-read`, {
      method: 'POST',
      headers: getHeaders()
    });
    await handleResponse(res);
  }
};
