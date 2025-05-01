import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://3.92.108.217/notary';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'notary' | 'admin';
  is_verified: boolean;
  created_at: string;
  profile?: {
    phone_number?: string;
    address?: string;
    city?: string;
    country?: string;
  };
}

class AuthService {
  private static instance: AuthService;
  private tokens: AuthTokens | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.tokens?.access) {
      headers['Authorization'] = `Bearer ${this.tokens.access}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.tokens?.refresh) {
      try {
        await this.refreshToken();
        headers['Authorization'] = `Bearer ${this.tokens?.access}`;
        return fetch(url, { ...options, headers });
      } catch (error) {
        await this.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  async init() {
    try {
      // For testing: Always clear tokens on app initialization
      await AsyncStorage.removeItem('auth_tokens');
      this.tokens = null;
      console.log('Auth tokens cleared for testing');
      
      // Original code (commented out for now)
      // const tokensStr = await AsyncStorage.getItem('auth_tokens');
      // if (tokensStr) {
      //   this.tokens = JSON.parse(tokensStr);
      // }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  async login(credentials: LoginCredentials) {
    const response = await this.request('/api/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.tokens = {
      access: response.access,
      refresh: response.refresh,
    };

    await AsyncStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
    return response.user;
  }

  async register(data: RegisterData) {
    const response = await this.request('/api/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.user;
  }

  async refreshToken() {
    if (!this.tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    const response = await this.request('/api/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: this.tokens.refresh }),
    });

    this.tokens = {
      ...this.tokens,
      access: response.access,
    };

    await AsyncStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
  }

  async logout() {
    this.tokens = null;
    await AsyncStorage.removeItem('auth_tokens');
  }

  async getProfile(): Promise<UserProfile> {
    return this.request('/api/profile/');
  }

  async updateProfile(data: Partial<UserProfile>) {
    return this.request('/api/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  isAuthenticated(): boolean {
    return !!this.tokens?.access;
  }
}

export const authService = AuthService.getInstance();