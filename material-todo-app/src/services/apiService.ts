const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  if (!response.ok) {
    let errorData: ApiErrorResponse | string;
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = await response.text();
    }
    console.error('API Error:', errorData);
    const message = typeof errorData === 'string'
      ? errorData
      : (errorData as ApiErrorResponse).error?.message || `HTTP error ${response.status}`;
    throw new Error(message);
  }
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  // If no content or not JSON, resolve with null or handle as needed
  // For 204 No Content, response.json() would fail.
  if (response.status === 204) {
    return null as T;
  }
  return response.text() as unknown as Promise<T>; // Or handle other content types
}

// Function to get the auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Function to set the auth token in localStorage
export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

// API client instance
const apiClient = {
  async post<T, R>(path: string, body: T, requiresAuth = false): Promise<R> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Handle missing token for authenticated requests if needed, e.g., redirect to login
        console.warn(`Auth token missing for POST request to ${path}`);
      }
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<R>(response);
  },

  async get<R>(path: string, requiresAuth = true): Promise<R> {
    const headers: HeadersInit = {};
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
         // Handle missing token for authenticated requests
        console.warn(`Auth token missing for GET request to ${path}`);
      }
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers,
    });
    return handleResponse<R>(response);
  },

  // Add other methods like patch, delete as needed
};

// Authentication service functions
export const authService = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  fetchMe: () => apiClient.get('/auth/me', true),
  // logout: (data: any) => apiClient.post('/auth/logout', data, true), // Requires token
  // refreshToken: (data: any) => apiClient.post('/auth/refresh', data),
};

// Example Task service functions (to be expanded in Phase 2)
// export const taskService = {
//   fetchTasks: (workspaceId: string) => apiClient.get(`/workspaces/${workspaceId}/tasks`, true),
//   createTask: (workspaceId: string, data: any) => apiClient.post(`/workspaces/${workspaceId}/tasks`, data, true),
// };

export default apiClient;
