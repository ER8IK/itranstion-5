/**
 * Frontend TypeScript types
 */

export type UserStatus = 'unverified' | 'active' | 'blocked';

export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  last_login: string | null;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  redirect?: boolean;
}

/**
 * IMPORTANT: Function to generate unique ID value
 * Required by the task specification
 */
export function getUniqIdValue(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
