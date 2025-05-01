import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService, UserProfile } from '@/services/authService';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
};

type AuthAction =
  | { type: 'RESTORE_TOKEN'; user: UserProfile | null }
  | { type: 'SIGN_IN'; user: UserProfile }
  | { type: 'SIGN_OUT' }
  | { type: 'REGISTER'; user: UserProfile }
  | { type: 'UPDATE_USER'; user: Partial<UserProfile> };

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  completeRegistration: () => Promise<void>;
  updateUser: (userData: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isAuthenticated: !!action.user,
        isLoading: false,
        user: action.user,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.user,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
      };
    case 'REGISTER':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        await authService.init();
        
        if (authService.isAuthenticated()) {
          const user = await authService.getProfile();
          dispatch({ type: 'RESTORE_TOKEN', user });
        } else {
          dispatch({ type: 'RESTORE_TOKEN', user: null });
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        dispatch({ type: 'RESTORE_TOKEN', user: null });
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const user = await authService.login({ email, password });
      dispatch({ type: 'SIGN_IN', user });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      const user = await authService.register({
        email: data.email,
        password: data.password,
        full_name: `${data.firstName} ${data.lastName}`,
      });
      dispatch({ type: 'REGISTER', user });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const completeRegistration = async () => {
    if (state.user) {
      try {
        const updatedUser = await authService.updateProfile({
          is_verified: true,
        });
        dispatch({ type: 'UPDATE_USER', user: updatedUser });
      } catch (error) {
        console.error('Complete registration error:', error);
        throw error;
      }
    }
  };

  const updateUser = async (userData: Partial<UserProfile>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', user: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}