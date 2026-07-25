export type Role = 'Citizen' | 'LegalExpert' | 'Admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalCode: string | null;
  phone: string | null;
  email: string | null;
  role: Role;
  createdAt: string;
}
