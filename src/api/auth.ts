import { api } from "./client";

export type User = { id: string; email: string; name?: string };

export async function me() {
  return api<User>("/me");
}

export async function login(email: string, password: string) {
  return api<User>("/auth/login", { method: "POST", body: { email, password } });
}

export async function signup(email: string, password: string, name?: string) {
  return api<User>("/auth/signup", { method: "POST", body: { email, password, name } });
}

export async function logout() {
  return api<{ ok: true }>("/auth/logout", { method: "POST" });
}
