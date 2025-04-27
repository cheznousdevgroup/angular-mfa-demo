export interface User {
  id: string;
  email: string;
  password: string; // Dans une vraie application, ne stockez jamais les mots de passe côté client
  firstName?: string;
  lastName?: string;
  mfaEnabled: boolean;
  mfaType?: 'app' | 'sms';
  mfaSecret?: string;
  phoneNumber?: string;
  backupCodes?: BackupCode[];
  lastMfaVerification?: Date;
}

export interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  backupCode?: string;
}

export interface LoginResponse {
  success: boolean;
  mfaRequired?: boolean;
  userId?: string;
  token?: string;
  message?: string;
}
