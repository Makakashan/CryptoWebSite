// Auth Domain Types

export interface User {
  id: number;
  username: string;
  balance: number;
  avatar?: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  avatar?: string | null;
}

export interface AuthResponse {
  message: string;
  user?: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
