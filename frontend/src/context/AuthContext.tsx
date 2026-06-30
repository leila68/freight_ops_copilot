import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  setAuthToken,
  setUnauthorizedHandler,
} from "@/api/client"
import { authApi } from "@/api/auth"
import type { LoginRequest, SignupRequest, User } from "@/types"

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<User>
  signup: (payload: SignupRequest) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setAuthToken(null)
  }, [])

  // Wire the axios 401 handler to log out. The redirect itself is handled
  // by route guards reacting to isAuthenticated becoming false.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

const login = useCallback(async (payload: LoginRequest) => {
  const res = await authApi.login(payload)
  setAuthToken(res.access_token)  // still needed for future requests after login
  setToken(res.access_token)
  setUser(res.user)
  return res.user
}, [])

const signup = useCallback(async (payload: SignupRequest) => {
  const res = await authApi.signup(payload)
  setAuthToken(res.access_token)  // still needed for future requests after signup
  setToken(res.access_token)
  setUser(res.user)
  return res.user
}, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
    }),
    [user, token, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
