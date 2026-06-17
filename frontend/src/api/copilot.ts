import { api } from "./client"
import type { CopilotChatRequest, CopilotChatResponse } from "@/types"

// AI Copilot endpoint.
// TODO: confirm endpoint path and whether the backend streams (SSE) or returns
// a single JSON payload. This implementation assumes a single JSON response;
// the chat UI is structured to support rendering intermediate `steps` if sent.
export const copilotApi = {
  chat: async (payload: CopilotChatRequest): Promise<CopilotChatResponse> => {
    const { data } = await api.post<CopilotChatResponse>("/copilot/chat", payload)
    return data
  },
}
