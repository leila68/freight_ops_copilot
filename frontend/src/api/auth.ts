import { api } from "./client"
import type { AuthResponse, LoginRequest, SignupRequest, User } from "@/types"

export const authApi = {
  login: async (payload: LoginRequest): Promise<{ access_token: string; user: User }> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload)
    const user = await authApi.me(data.access_token)
    return { access_token: data.access_token, user }
  },

  signup: async (payload: SignupRequest): Promise<{ access_token: string; user: User }> => {
    const { data } = await api.post<AuthResponse>("/auth/signup", {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
      role: payload.role,
      company_name: payload.company_name,
    })

    // //  check what backend actually returned
    // console.log("SIGNUP RESPONSE:", data)
    // //  specifically check token
    // console.log("ACCESS TOKEN:", data.access_token)

    const user = await authApi.me(data.access_token)
    return { access_token: data.access_token, user }
  },

  me: async (token?: string): Promise<User> => {
    const { data } = await api.get<User>("/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    return data
  },
}