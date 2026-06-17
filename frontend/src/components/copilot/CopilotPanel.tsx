import { useEffect, useRef, useState } from "react"
import { Bot, Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { copilotApi } from "@/api/copilot"
import { getErrorMessage } from "@/api/client"
import { cn } from "@/lib/utils"
import type { CopilotMessage } from "@/types"

const SUGGESTIONS = [
  "What would it cost to ship a dry van from Toronto to Montreal?",
  "Which lanes have the highest base rates?",
  "Explain how accessorial charges affect my quote.",
]

let idCounter = 0
const nextId = () => `msg-${Date.now()}-${idCounter++}`

export function CopilotPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setError(null)
    const userMsg: CopilotMessage = { id: nextId(), role: "user", content: trimmed }
    const pendingMsg: CopilotMessage = {
      id: nextId(),
      role: "assistant",
      content: "",
      pending: true,
    }
    setMessages((m) => [...m, userMsg, pendingMsg])
    setInput("")
    setSending(true)

    try {
      const res = await copilotApi.chat({
        message: trimmed,
        conversation_id: conversationId,
      })
      setConversationId(res.conversation_id)
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingMsg.id
            ? { ...msg, content: res.message, steps: res.steps, pending: false }
            : msg,
        ),
      )
    } catch (err) {
      setError(getErrorMessage(err))
      // Remove the pending placeholder on failure.
      setMessages((m) => m.filter((msg) => msg.id !== pendingMsg.id))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI Copilot" : "Open AI Copilot"}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          open && "scale-0 opacity-0",
        )}
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="AI Copilot"
        aria-hidden={!open}
        className={cn(
          "fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[calc(100vh-3rem)] sm:w-[420px] sm:rounded-xl sm:border",
          open ? "translate-x-0" : "translate-x-full sm:translate-x-[calc(100%+1.5rem)]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Freight Copilot</p>
              <p className="text-xs text-muted-foreground">Ask about quotes & rates</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col">
              <p className="text-sm text-muted-foreground">
                Hi! I can help you estimate freight costs, compare lanes, and explain
                how your quotes are built. Try one of these:
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Composer */}
        <form onSubmit={handleSubmit} className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask the copilot..."
              className="max-h-28 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="h-8 w-8 shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </aside>
    </>
  )
}

function MessageBubble({ message }: { message: CopilotMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        {/* Tool / status steps */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <div className="flex flex-col gap-1">
            {message.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                {step.text}
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          {message.pending ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking...
            </span>
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>
      </div>
    </div>
  )
}
