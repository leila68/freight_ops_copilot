import { api } from "./client"
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  User,
} from "@/types"

// Auth endpoints.
// TODO: confirm endpoint paths and response shapes with the FastAPI backend.
export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload)
    return data
  },

  signup: async (payload: SignupRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/signup", payload)
    return data
  },

  // Optional: validate / fetch the current user from a token.
  // TODO: confirm whether backend exposes GET /auth/me
  me: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me")
    return data
  },
}
