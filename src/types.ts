export type Role = 'Citizen' | 'LegalExpert' | 'Admin';

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  nationalCode: string | null;
  phone: string | null;
  email?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
  role: Role;
  status?: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface Question {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
  response?: Response;
}

export interface Response {
  id: string;
  questionId: string;
  content: string;
  createdAt: string;
}

export interface Law {
  id: string;
  title: string;
  category: string;
  description: string;
}

export interface Crisis {
  id: string;
  crisisType: string;
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  contactInfo: string;
}

export interface SupportService {
  id: string;
  title: string;
  description: string;
  steps: string[];
  requiredDocuments: string[];
  organizationId: string;
}
