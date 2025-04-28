import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Mock data for development
const MOCK_USER = {
  id: '1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatarUrl: null,
};

// For web compatibility (SecureStore is not available on web)
const secureStorage = {
  async getItem(key: string) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },
  async removeItem(key: string) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },
};

// Types
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
};

type AuthAction =
  | { type: 'RESTORE_TOKEN'; token: string | null; user: User | null }
  | { type: 'SIGN_IN'; token: string; user: User }
  | { type: 'SIGN_OUT' }
  | { type: 'REGISTER'; token: string; user: User }
  | { type: 'UPDATE_USER'; user: Partial<User> };

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  completeRegistration: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
};

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Reducer for state management
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isAuthenticated: action.token !== null,
        isLoading: false,
        token: action.token,
        user: action.user,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        token: action.token,
        user: action.user,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
      };
    case 'REGISTER':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        token: action.token,
        user: action.user,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.user } : null,
      };
    default:
      return state;
  }
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load token from storage on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        let userToken: string | null = null;
        let userData: User | null = null;

        userToken = await secureStorage.getItem('userToken');
        const userDataStr = await secureStorage.getItem('userData');
        if (userDataStr) {
          userData = JSON.parse(userDataStr);
        }

        dispatch({ type: 'RESTORE_TOKEN', token: userToken, user: userData });
      } catch (error) {
        console.error('Failed to load auth data:', error);
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    };

    bootstrapAsync();
  }, []);

  // Auth functions
  const login = async (email: string, password: string) => {
    try {
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const token = 'mock-token-' + Math.random();
      
      // Store token and user data
      await secureStorage.setItem('userToken', token);
      await secureStorage.setItem('userData', JSON.stringify(MOCK_USER));
      
      dispatch({ type: 'SIGN_IN', token, user: MOCK_USER });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await secureStorage.removeItem('userToken');
      await secureStorage.removeItem('userData');
      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (userData: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const token = 'mock-token-' + Math.random();
      const newUser = {
        id: 'new-' + Math.random().toString(36).substr(2, 9),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        avatarUrl: null,
      };
      
      // Store token and user data
      await secureStorage.setItem('userToken', token);
      await secureStorage.setItem('userData', JSON.stringify(newUser));
      
      dispatch({ type: 'REGISTER', token, user: newUser });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const completeRegistration = async () => {
    if (state.user) {
      try {
        const updatedUser = {
          ...state.user,
          isVerified: true,
        };
        
        await secureStorage.setItem('userData', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', user: { isVerified: true } });
      } catch (error) {
        console.error('Complete registration error:', error);
        throw error;
      }
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (state.user) {
      try {
        const updatedUser = { ...state.user, ...userData };
        await secureStorage.setItem('userData', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', user: userData });
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    }
  };

  const value: AuthContextType = {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    login,
    logout,
    register,
    completeRegistration,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}