import { api, setAuthToken } from "./client"
import type { AuthResponse, LoginRequest, SignupRequest, User } from "@/types"

export const authApi = {
  login: async (payload: LoginRequest): Promise<{ access_token: string; user: User }> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload)
    // Set token immediately so the /auth/me call is authenticated
    setAuthToken(data.access_token)
    const user = await authApi.me()
    return { access_token: data.access_token, user }
  },

  signup: async (payload: SignupRequest): Promise<{ access_token: string; user: User }> => {
    const { data } = await api.post<AuthResponse>("/auth/signup", {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,       // matches backend field name
      role: payload.role,
      company_name: payload.company_name, // matches backend field name
    })
    setAuthToken(data.access_token)
    const user = await authApi.me()
    return { access_token: data.access_token, user }
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me")
    return data
  },
}