const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Auth headers
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// Auth API
export const authAPI = {
  signup: async (name, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Signup failed');
    }
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Login failed');
    }
    return res.json();
  }
};

// Profile API
export const profileAPI = {
  get: async () => {
    const res = await fetch(`${API_URL}/api/profile`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  update: async (name) => {
    const res = await fetch(`${API_URL}/api/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  }
};

// Tasks API
export const tasksAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    
    const res = await fetch(`${API_URL}/api/tasks?${params}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  create: async (task) => {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  update: async (id, task) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  }
};

// Analytics API
export const analyticsAPI = {
  get: async () => {
    const res = await fetch(`${API_URL}/api/analytics`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  }
};

// Insights API
export const insightsAPI = {
  get: async () => {
    const res = await fetch(`${API_URL}/api/insights`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  }
};
