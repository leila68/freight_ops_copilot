import axios, { AxiosError, type AxiosInstance } from "axios"

// Base URL of the FastAPI backend. Set VITE_API_URL in your Vercel project.
// TODO: confirm the deployed backend URL.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// In-memory token store (not localStorage, per requirements).
// The AuthContext is the source of truth; we mirror the token here so the
// axios interceptor can attach it without a React dependency.
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

// Callback invoked when a 401 is received, wired up by AuthContext to log out
// and redirect to the login screen.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
})

// Attach JWT to every request.
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// Handle 401s globally: clear token and notify the app to redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAuthToken(null)
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

// Normalize an axios error into a human-readable message for UI display.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; message?: string } | undefined
    return data?.detail || data?.message || error.message || "Something went wrong."
  }
  if (error instanceof Error) return error.message
  return "An unexpected error occurred."
}
