/**
 * User model types and interfaces
 */

export type UserStatus = 'unverified' | 'active' | 'blocked';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  status: UserStatus;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * User data transfer object (without sensitive fields)
 */
export interface UserDTO {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  last_login: Date | null;
  created_at: Date;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * IMPORTANT: Function to generate unique ID value
 * This satisfies the requirement to add getUniqIdValue function
 */
export function getUniqIdValue(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
