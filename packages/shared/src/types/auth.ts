export interface ContextUser {
  id: string;
  email: string;
  full_name: string;
  enabled: boolean;
  [key: string]: unknown;
}

export interface ContextAuth {
  user: ContextUser | null;
  roles: string[];
}
