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
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"))
  const [user, setUser] = useState<User | null>(null)

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
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

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token")
    if (savedToken && !user) {
      setAuthToken(savedToken)
      authApi.me(savedToken)
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("auth_token")
          setToken(null)
          setAuthToken(null)
        })
    }
  }, [])

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await authApi.login(payload)
    localStorage.setItem("auth_token", res.access_token)
    setAuthToken(res.access_token)
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }, [])

  const signup = useCallback(async (payload: SignupRequest) => {
    const res = await authApi.signup(payload)
    localStorage.setItem("auth_token", res.access_token)
    setAuthToken(res.access_token)
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
