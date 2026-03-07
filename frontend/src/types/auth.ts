export type User = {
  id: string;
  email: string;
  createdAt?: string;
};

export type AuthResponse = {
  user: User;
};
