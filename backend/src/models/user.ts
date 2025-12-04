export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl: string;
  role: 'user' | 'admin' | 'specialist';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}