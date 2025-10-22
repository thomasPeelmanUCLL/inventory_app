type Role = "admin" | "user";

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  age: number;
  role: string;
}

