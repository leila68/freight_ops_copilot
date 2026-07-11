import { api } from "./client"
import type { CopilotChatRequest, CopilotChatResponse } from "@/types"

// AI Copilot endpoint — POST /api/chat, single JSON response (not streaming).
// Matches app.api.chat.send_message: creates a session when session_id is
// omitted, otherwise continues the caller's existing session.
export const copilotApi = {
  chat: async (payload: CopilotChatRequest): Promise<CopilotChatResponse> => {
    const { data } = await api.post<CopilotChatResponse>("/api/chat", payload)
    return data
  },
}