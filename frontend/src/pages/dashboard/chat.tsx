import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import {
  createChatWebSocket,
  sendChatMessage,
  setupChatWebSocketListeners,
  closeChatWebSocket,
} from "@/api/chat"
import { getProjects } from "@/api/projects"
import type { ChatBubble, ChatMessage } from "@/types/chat"
import type { Project } from "@/types/projects"
import { PROJECT_DOT_COLOR_MAP } from "@/types/projects"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Send,
  Bot,
  User,
  MessageSquare,
  Search,
  ListChecks,
  Lightbulb,
  Sparkles,
  WifiOff,
  Loader2,
  Filter,
} from "lucide-react"

const SUGGESTIONS = [
  {
    icon: Search,
    label: "Search my notes",
    prompt: "Search my notes for key topics and summarize what you find.",
  },
  {
    icon: ListChecks,
    label: "List all notes",
    prompt: "List all my voice notes with their dates and tags.",
  },
  {
    icon: Lightbulb,
    label: "Find action items",
    prompt: "Search through my notes and find any action items or tasks I mentioned.",
  },
  {
    icon: Sparkles,
    label: "Summarize recent",
    prompt: "Give me a summary of what my most recent notes are about.",
  },
]

export const ChatPage = () => {
  const [messages, setMessages] = useState<ChatBubble[]>([])
  const [input, setInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())

  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const streamingContentRef = useRef("")

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    getProjects().then(({ data }) => {
      if (data) setProjects(data)
    })
  }, [])

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const resetConnectionState = useCallback(() => {
    setIsConnected(false)
    setIsConnecting(false)
    setIsStreaming(false)
  }, [])

  const updateLastAssistantMessage = useCallback((updater: (msg: ChatBubble) => ChatBubble) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === "assistant" && last.isStreaming) {
        return [...prev.slice(0, -1), updater(last)]
      }
      return prev
    })
  }, [])

  const connectWebSocket = useCallback(async () => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    )
      return

    setIsConnecting(true)
    try {
      const ws = await createChatWebSocket()
      wsRef.current = ws

      setupChatWebSocketListeners(ws, {
        onOpen: () => {
          setIsConnected(true)
          setIsConnecting(false)
        },
        onToken: (token: string) => {
          streamingContentRef.current += token
          const captured = streamingContentRef.current
          updateLastAssistantMessage(msg => ({ ...msg, content: captured }))
        },
        onStreamEnd: () => {
          updateLastAssistantMessage(msg => ({ ...msg, isStreaming: false }))
          streamingContentRef.current = ""
          setIsStreaming(false)
        },
        onMessage: (msg: ChatMessage) => {
          if (msg.type === "error") {
            setMessages(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: `⚠️ ${msg.content}`,
                isStreaming: false,
                timestamp: new Date(),
              },
            ])
            setIsStreaming(false)
          }
        },
        onClose: resetConnectionState,
        onError: resetConnectionState,
      })
    } catch (error) {
      console.error("Failed to create WebSocket:", error)
      resetConnectionState()
    }
  }, [resetConnectionState, updateLastAssistantMessage])

  useEffect(() => {
    // Schedule connection outside the synchronous effect body
    const id = requestAnimationFrame(() => void connectWebSocket())
    return () => {
      cancelAnimationFrame(id)
      if (wsRef.current) {
        closeChatWebSocket(wsRef.current)
        wsRef.current = null
      }
    }
  }, [connectWebSocket])

  const handleSend = useCallback(
    (text?: string) => {
      const content = (text ?? input).trim()
      if (!content || !wsRef.current || isStreaming) return

      const userMessage: ChatBubble = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      }

      const assistantPlaceholder: ChatBubble = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        isStreaming: true,
        timestamp: new Date(),
      }

      streamingContentRef.current = ""
      setMessages(prev => [...prev, userMessage, assistantPlaceholder])
      setIsStreaming(true)
      setInput("")

      sendChatMessage(
        wsRef.current,
        content,
        selectedProjectIds.size > 0 ? [...selectedProjectIds] : undefined
      )

      setTimeout(() => textareaRef.current?.focus(), 0)
    },
    [input, isStreaming, selectedProjectIds]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    connectWebSocket()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={prompt => handleSend(prompt)} isConnected={isConnected} />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6 py-6">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-2 sm:px-4 py-3">
        <div className="mx-auto w-full max-w-3xl">
          {!isConnected && !isConnecting && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <WifiOff className="size-4 shrink-0" />
              <span>Disconnected from chat.</span>
              <Button
                variant="link"
                size="xs"
                onClick={handleReconnect}
                className="text-destructive ml-auto"
              >
                Reconnect
              </Button>
            </div>
          )}

          {/* Project filter */}
          {projects.length > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                    <Filter className="size-3" />
                    {selectedProjectIds.size === 0
                      ? "All notes"
                      : `${selectedProjectIds.size} project${selectedProjectIds.size > 1 ? "s" : ""}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs">Filter by project</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedProjectIds.size === 0}
                    onCheckedChange={() => setSelectedProjectIds(new Set())}
                  >
                    All notes
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {projects.map(project => (
                    <DropdownMenuCheckboxItem
                      key={project.id}
                      checked={selectedProjectIds.has(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-2 rounded-full ${PROJECT_DOT_COLOR_MAP[project.color] || "bg-blue-500"}`}
                        />
                        <span className="truncate">{project.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {project.note_count}
                        </span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {selectedProjectIds.size > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto">
                  {projects
                    .filter(p => selectedProjectIds.has(p.id))
                    .map(p => (
                      <Badge
                        key={p.id}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 shrink-0 cursor-pointer hover:bg-accent"
                        onClick={() => toggleProject(p.id)}
                      >
                        <div
                          className={`size-1.5 rounded-full mr-1 ${PROJECT_DOT_COLOR_MAP[p.color] || "bg-blue-500"}`}
                        />
                        {p.name}
                      </Badge>
                    ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] text-muted-foreground shrink-0"
                    onClick={() => setSelectedProjectIds(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="relative flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Ask about your notes..." : "Connecting..."}
              disabled={!isConnected || isStreaming}
              className="min-h-11 max-h-40 resize-none pr-12 rounded-xl"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || !isConnected || isStreaming}
              size="icon"
              className="absolute right-1.5 bottom-1.5 size-8 rounded-lg"
            >
              {isStreaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI can search your notes and the web. Responses may not always be accurate.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Empty state ─── */

function EmptyState({
  onSuggestionClick,
  isConnected,
}: {
  onSuggestionClick: (prompt: string) => void
  isConnected: boolean
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <MessageSquare className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Chat with your notes</h2>
        <p className="max-w-md text-muted-foreground">
          Ask questions about your voice notes, find information, or get summaries. The AI can
          search through all your notes and the web.
        </p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s.label}
            onClick={() => isConnected && onSuggestionClick(s.prompt)}
            disabled={!isConnected}
            className={cn(
              "group flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all",
              "hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <s.icon className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">{s.label}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Message bubble ─── */

function MessageBubble({ message }: { message: ChatBubble }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback
          className={cn(
            "rounded-lg text-xs",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted/60 rounded-bl-md"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="min-w-0">
            {message.content ? (
              <div className="chat-markdown max-w-none wrap-break-word">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : message.isStreaming ? (
              <div className="flex items-center gap-1.5 py-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            ) : null}
            {message.isStreaming && message.content && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground/70 animate-pulse rounded-sm align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
