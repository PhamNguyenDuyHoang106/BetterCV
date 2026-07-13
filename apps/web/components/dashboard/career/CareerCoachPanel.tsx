import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../../lib/store/auth";
import { apiFetch } from "../../../lib/api";
import { useLanguageStore } from "../../../lib/store/language";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type Session = {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  updatedAt: string;
  messages?: Message[];
};

type CoachAnalytics = {
  kpis: {
    totalSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
    mostActiveSession?: {
      id: string;
      title: string;
      messageCount: number;
    };
    lastInteractionAt?: string;
  };
  topSkills: Array<{
    skill: string;
    count: number;
  }>;
  topPhases: Array<{
    phaseIndex: number;
    count: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
  suggestions: Array<{
    type: "learning_focus" | "prerequisite";
    skill?: string;
    message: string;
  }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  roadmapId: string;
  roadmap: {
    targetRole: string;
    phases: Array<{
      id: string;
      phaseIndex: number;
      phaseName: string;
      skills: Array<{
        id: string;
        name: string;
      }>;
    }>;
  };
  t: {
    coachTitle: string;
    coachSubtitle: string;
    coachPlaceholder: string;
    coachSend: string;
    coachDefaultGreeting: string;
    coachChipStart: string;
    coachChipResources: string;
    coachChipInterview: string;
    coachLoadingHistory: string;
    coachEmptySession: string;
    coachTabChat: string;
    coachTabInsights: string;
    coachAnalyticsTotalSessions: string;
    coachAnalyticsTotalMessages: string;
    coachAnalyticsLastActive: string;
    coachAnalyticsMostDiscussed: string;
    coachAnalyticsFocusSuggestion: string;
    coachAnalyticsTimeline: string;
    coachAnalyticsAvgMessages: string;
    coachAnalyticsNever: string;
  };
};

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

export function CareerCoachPanel({ open, onClose, roadmapId, roadmap, t }: Props) {
  const { language } = useLanguageStore();
  const activeLang = language || "vi";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Thread editing and management
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // Infinite Scroll Pagination
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Search Conversations
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tab toggling & analytics insights
  const [activeTab, setActiveTab] = useState<"chat" | "insights">("chat");
  const [analytics, setAnalytics] = useState<CoachAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await apiFetch<any>(`/career/coach/analytics/${roadmapId}`);
      const data = res?.data || res;
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load coach analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === "insights" && open) {
      fetchAnalytics();
    }
  }, [activeTab, open, roadmapId]);

  // Load active sessions list when panel is opened
  const loadSessionsList = async (activateLatest = false) => {
    try {
      setFetchingHistory(true);
      const res = await apiFetch<any>(`/career/coach/sessions/${roadmapId}`);
      const data = res?.data || res;
      const sessions = data?.sessions || data || [];
      setSessions(sessions);

      if (sessions && sessions.length > 0) {
        if (activateLatest || !currentSessionId) {
          const latest = sessions[0];
          setCurrentSessionId(latest.id);
          setMessages(latest.messages || []);
          setHasMoreMessages((latest.messages?.length || 0) >= 50);
        } else {
          // Re-sync current session messages from fresh list if active
          const current = sessions.find((s: any) => s.id === currentSessionId);
          if (current) {
            setMessages(current.messages || []);
          }
        }
      } else {
        // No sessions exist yet
        setMessages([
          {
            id: "initial-greeting",
            role: "assistant",
            content: t.coachDefaultGreeting,
          },
        ]);
        setCurrentSessionId(null);
      }
    } catch (err) {
      console.error("Failed to load coach sessions:", err);
    } finally {
      setFetchingHistory(false);
      setSessionsLoaded(true);
    }
  };

  useEffect(() => {
    if (open && !sessionsLoaded) {
      loadSessionsList(true);
    }
  }, [open, roadmapId, sessionsLoaded]);

  // Reset sessionsLoaded when panel is closed
  useEffect(() => {
    if (!open) {
      setSessionsLoaded(false);
      setSidebarOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      setActiveTab("chat");
    }
  }, [open]);

  // Autoscroll to bottom when new messages arrive (only if scroll is near bottom)
  useEffect(() => {
    if (!highlightedMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, highlightedMessageId]);

  // Handle highlighted message scroll and flash
  useEffect(() => {
    if (highlightedMessageId) {
      const element = document.getElementById(`msg-${highlightedMessageId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Flash animation is handled by tailwind/CSS classes
      }
    }
  }, [highlightedMessageId]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle scroll pagination
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && !loading && !fetchingHistory && hasMoreMessages && currentSessionId) {
      const firstMsg = messages.find((m) => m.id !== "initial-greeting");
      if (!firstMsg || !firstMsg.createdAt) return;

      const beforeTimestamp = firstMsg.createdAt;
      const prevScrollHeight = container.scrollHeight;

      try {
        setFetchingHistory(true);
        const fetchRes = await apiFetch<any>(
          `/career/coach/session/${currentSessionId}/messages?beforeTimestamp=${beforeTimestamp}`
        );
        const res = fetchRes?.data || fetchRes;
        const messagesList = res?.messages || res || [];

        if (messagesList && messagesList.length > 0) {
          const mapped = messagesList.map((m: any) => ({
            id: m.id,
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content,
            createdAt: m.createdAt,
          }));

          setMessages((prev) => [...mapped, ...prev]);
          setHasMoreMessages(messagesList.length >= 50);

          // Restore scroll anchor
          setTimeout(() => {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }, 50);
        } else {
          setHasMoreMessages(false);
        }
      } catch (err) {
        console.error("Failed to paginate messages:", err);
      } finally {
        setFetchingHistory(false);
      }
    }
  };

  // Explicitly create a new thread
  const handleCreateSession = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<any>("/career/coach/session", {
        method: "POST",
        body: JSON.stringify({ roadmapId }),
      });
      const newSession = res?.data || res;

      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([
        {
          id: "initial-greeting",
          role: "assistant",
          content: t.coachDefaultGreeting,
        },
      ]);
      setHasMoreMessages(false);
      setSidebarOpen(false);
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setLoading(false);
    }
  };

  // Soft-archive a session thread
  const handleArchiveSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Archive this conversation thread?")) return;

    try {
      await apiFetch(`/career/coach/session/${id}/archive`, {
        method: "POST",
      });

      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id);
          // Load messages of the new active session
          setFetchingHistory(true);
          const resDetail = await apiFetch<any>(
            `/career/coach/session/${remaining[0].id}/messages`
          );
          const detail = resDetail?.data || resDetail;
          const messagesList = detail?.messages || detail || [];
          setMessages(
            messagesList.map((m: any) => ({
              id: m.id,
              role: m.role.toLowerCase() as "user" | "assistant",
              content: m.content,
              createdAt: m.createdAt,
            }))
          );
          setHasMoreMessages(messagesList.length >= 50);
          setFetchingHistory(false);
        } else {
          setCurrentSessionId(null);
          setMessages([
            {
              id: "initial-greeting",
              role: "assistant",
              content: t.coachDefaultGreeting,
            },
          ]);
          setHasMoreMessages(false);
        }
      }
    } catch (err) {
      console.error("Failed to archive session:", err);
    }
  };

  // Inline rename thread title
  const handleStartRename = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleInput(session.title);
  };

  const handleSaveRename = async (id: string) => {
    if (!editTitleInput.trim() || editTitleInput.trim() === "") {
      setEditingSessionId(null);
      return;
    }
    try {
      await apiFetch(`/career/coach/session/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitleInput }),
      });

      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editTitleInput } : s))
      );
    } catch (err) {
      console.error("Failed to rename session:", err);
    } finally {
      setEditingSessionId(null);
    }
  };

  // Search Conversations
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const res = await apiFetch<any>(
          `/career/coach/search?roadmapId=${roadmapId}&query=${encodeURIComponent(trimmed)}`
        );
        const data = res?.data || res;
        setSearchResults(data?.results || data || []);
      } catch (err) {
        console.error("Failed to search conversations:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, roadmapId]);

  const handleSelectSearchResult = async (result: any) => {
    try {
      setFetchingHistory(true);
      setCurrentSessionId(result.sessionId);
      setSidebarOpen(false);
      setSearchQuery("");
      setSearchResults([]);

      // Fetch all messages of the target session
      const resDetail = await apiFetch<any>(
        `/career/coach/session/${result.sessionId}/messages`
      );
      const detail = resDetail?.data || resDetail;
      const messagesList = detail?.messages || detail || [];

      const mapped = messagesList.map((m: any) => ({
        id: m.id,
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt,
      }));

      setMessages(mapped);
      setHasMoreMessages(messagesList.length >= 50);

      // Trigger message highlighting
      setTimeout(() => {
        setHighlightedMessageId(result.messageId);
        // Clear highlight flash after 3 seconds
        setTimeout(() => {
          setHighlightedMessageId(null);
        }, 3000);
      }, 300);
    } catch (err) {
      console.error("Failed to jump to search result thread:", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setInput("");
    setLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `coach-${Date.now()}`;

    // Remove greeting placeholder if it's the only message in a blank view
    const filteredPrev = messages.filter((m) => m.id !== "initial-greeting");

    const newMessages: Message[] = [
      ...filteredPrev,
      { id: userMsgId, role: "user", content: textToSend, createdAt: new Date().toISOString() },
    ];
    setMessages(newMessages);

    // Placeholder message for coach's incoming stream
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "", createdAt: new Date().toISOString() },
    ]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = useAuthStore.getState().accessToken;

      const response = await fetch(`${baseUrl}/career/coach-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roadmapId,
          sessionId: currentSessionId || undefined,
          messages: [{ role: "user", content: textToSend }], // Send only current user message
          locale: activeLang,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      // Sync the session ID header
      const newSessionId = response.headers.get("x-session-id") || response.headers.get("X-Session-Id");
      if (newSessionId && newSessionId !== currentSessionId) {
        setCurrentSessionId(newSessionId);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder("utf-8");
      let streamBuffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });

        const lines = streamBuffer.split("\n\n");
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]" || dataStr.includes('"done":true')) {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: msg.content + parsed.text }
                      : msg
                  )
                );
              } else if (parsed.raw) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: parsed.raw } : msg
                  )
                );
              }
            } catch {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, content: msg.content + dataStr } : msg
                )
              );
            }
          }
        }
      }

      // Re-load threads list to sync metadata (title update on backend)
      await loadSessionsList(false);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Coach request stream aborted");
      } else {
        console.error("Coach stream error:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: "Sorry, I encountered an error connecting to the AI. Please try again.",
                }
              : msg
          )
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSelectSession = async (id: string) => {
    if (id === currentSessionId) {
      setSidebarOpen(false);
      return;
    }
    try {
      setFetchingHistory(true);
      setCurrentSessionId(id);
      setSidebarOpen(false);

      const resDetail = await apiFetch<any>(`/career/coach/session/${id}/messages`);
      const detail = resDetail?.data || resDetail;
      const messagesList = detail?.messages || detail || [];
      const mapped = messagesList.map((m: any) => ({
        id: m.id,
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt,
      }));

      setMessages(mapped.length > 0 ? mapped : [
        {
          id: "initial-greeting",
          role: "assistant",
          content: t.coachDefaultGreeting,
        },
      ]);
      setHasMoreMessages(messagesList.length >= 50);
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  // Safe basic markdown structures
  const renderMessageContent = (text: string) => {
    if (!text) return <div className="w-4 h-4 rounded-full bg-slate-400 animate-pulse mt-1" />;

    const paragraphs = text.split("\n\n");

    return paragraphs.map((para, pIndex) => {
      const lines = para.split("\n");

      // Check bullet lists
      const isList = lines.every((line) => line.trim().startsWith("- ") || line.trim().startsWith("* "));
      if (isList) {
        return (
          <ul key={pIndex} className="list-disc pl-5 my-2 space-y-1">
            {lines.map((line, lIndex) => {
              const cleaned = line.replace(/^[\s-*]+/, "").trim();
              return <li key={lIndex} dangerouslySetInnerHTML={{ __html: formatBoldText(cleaned) }} />;
            })}
          </ul>
        );
      }

      // Check numbered lists
      const isNumList = lines.every((line) => /^\d+\.\s/.test(line.trim()));
      if (isNumList) {
        return (
          <ol key={pIndex} className="list-decimal pl-5 my-2 space-y-1">
            {lines.map((line, lIndex) => {
              const cleaned = line.replace(/^\d+\.\s+/, "").trim();
              return <li key={lIndex} dangerouslySetInnerHTML={{ __html: formatBoldText(cleaned) }} />;
            })}
          </ol>
        );
      }

      return (
        <p
          key={pIndex}
          className="leading-relaxed mb-2"
          dangerouslySetInnerHTML={{ __html: formatBoldText(para.replace(/\n/g, "<br />")) }}
        />
      );
    });
  };

  const formatBoldText = (str: string) => {
    return str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  const firstSkill = roadmap.phases[0]?.skills[0]?.name || "";
  const targetRole = roadmap.targetRole;

  const chips = [
    t.coachChipStart,
    firstSkill ? t.coachChipResources.replace("{skill}", firstSkill) : "",
    t.coachChipInterview.replace("{role}", targetRole),
  ].filter(Boolean);

  if (!open) return null;

  return (
    <div className="fixed top-topnav-height bottom-0 right-0 w-full md:w-[450px] bg-white shadow-2xl border-l border-t border-slate-100 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Sidebar Toggle Menu */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors border-none bg-transparent"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div>
              <h3 className="font-black text-sm text-slate-800">{t.coachTitle}</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {t.coachSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Tab Switch Control */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all border-none ${
              activeTab === "chat"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 bg-transparent"
            }`}
          >
            {t.coachTabChat}
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all border-none ${
              activeTab === "insights"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 bg-transparent"
            }`}
          >
            {t.coachTabInsights}
          </button>
        </div>
      </div>

      {/* Main Drawer Layout containing Message Window + Slide-out Sidebar */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Content area: Chat message lists OR Insights dashboard */}
        {activeTab === "chat" ? (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 flex flex-col"
          >
            {fetchingHistory && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2.5 flex-1">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                <span className="text-xs font-bold">{t.coachLoadingHistory}</span>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`flex flex-col max-w-[85%] transition-colors duration-1000 ${
                      msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    } ${highlightedMessageId === msg.id ? "bg-yellow-100/55 p-1 rounded-2xl animate-pulse" : ""}`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-xs ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-200"
                          : "bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        renderMessageContent(msg.content)
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold mt-1 px-1 uppercase">
                      {msg.role === "user" ? "You" : "AI Coach"}
                    </span>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-100 mr-auto max-w-[85%] rounded-tl-none shadow-sm">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 flex flex-col">
            {loadingAnalytics || !analytics ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                <span className="text-xs font-bold">Calculating insights...</span>
              </div>
            ) : (
              <>
                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {t.coachAnalyticsTotalSessions}
                    </span>
                    <span className="text-xl font-black text-slate-800 mt-1">
                      {analytics.kpis.totalSessions}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {t.coachAnalyticsTotalMessages}
                    </span>
                    <span className="text-xl font-black text-slate-800 mt-1">
                      {analytics.kpis.totalMessages}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {t.coachAnalyticsAvgMessages}
                    </span>
                    <span className="text-xl font-black text-slate-800 mt-1">
                      {analytics.kpis.averageMessagesPerSession}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {t.coachAnalyticsLastActive}
                    </span>
                    <span className="text-xs font-black text-slate-700 truncate mt-2">
                      {analytics.kpis.lastInteractionAt
                        ? new Date(analytics.kpis.lastInteractionAt).toLocaleDateString()
                        : t.coachAnalyticsNever}
                    </span>
                  </div>
                </div>

                {/* Suggestions Section */}
                {analytics.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider px-1">
                      {t.coachAnalyticsFocusSuggestion}
                    </h4>
                    <div className="space-y-2.5">
                      {analytics.suggestions.map((s, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex gap-3 ${
                            s.type === "prerequisite"
                              ? "bg-rose-50/50 border-rose-100 text-rose-950"
                              : "bg-indigo-50/50 border-indigo-100 text-indigo-950"
                          }`}
                        >
                          <span className={`material-symbols-outlined text-lg ${
                            s.type === "prerequisite" ? "text-rose-500" : "text-indigo-500"
                          }`}>
                            {s.type === "prerequisite" ? "warning" : "lightbulb"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-relaxed">{s.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Skills Section */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    {t.coachAnalyticsMostDiscussed}
                  </h4>
                  {analytics.topSkills.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 font-bold">
                      No tech skills discussed yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.topSkills.map((sk, idx) => {
                        const maxCount = Math.max(...analytics.topSkills.map((s) => s.count), 1);
                        const percent = Math.min(100, Math.round((sk.count / maxCount) * 100));
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-700">{sk.skill}</span>
                              <span className="text-slate-400">{sk.count} mentions</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Activity Timeline Section */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    {t.coachAnalyticsTimeline}
                  </h4>
                  <div className="flex items-end justify-between h-28 px-2 pt-2">
                    {analytics.timeline.map((day, idx) => {
                      const maxCount = Math.max(...analytics.timeline.map((d) => d.count), 1);
                      const percent = Math.max(8, Math.round((day.count / maxCount) * 80));
                      const label = day.date.slice(5);
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 group">
                          <span className="text-[10px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 px-1 py-0.5 rounded mb-1">
                            {day.count}
                          </span>
                          <div className="w-6 bg-slate-100 rounded-t-md relative flex items-end justify-center overflow-hidden h-20">
                            <div
                              className="w-full bg-indigo-600 rounded-t-md transition-all duration-500"
                              style={{ height: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sidebar Drawer Panel */}
        {sidebarOpen && (
          <div className="absolute inset-0 bg-white/95 z-40 flex flex-col animate-in fade-in slide-in-from-left duration-250 border-r border-slate-100">
            {/* Sidebar Search Bar */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search in chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-600 text-xs font-black rounded-xl transition-colors border-none flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                New Conversation
              </button>
            </div>

            {/* Sidebar Content (Search Results OR Threads List) */}
            <div className="flex-1 overflow-y-auto">
              {searchQuery.trim().length >= 2 ? (
                // Search Results
                <div className="p-2 space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase font-black px-2 tracking-wider">
                    {searching ? "Searching..." : `Search Results (${searchResults.length})`}
                  </p>
                  {searchResults.length === 0 && !searching ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-bold">
                      No matching messages found
                    </div>
                  ) : (
                    searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full p-2.5 rounded-xl hover:bg-indigo-50/50 text-left border border-transparent hover:border-indigo-50 transition-all flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                            {res.sessionTitle}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {new Date(res.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 font-medium italic">
                          {res.snippet}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Active Threads List
                <div className="p-2 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-black px-2 tracking-wider mb-2">
                    Active Chats ({sessions.length})
                  </p>
                  {sessions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No active sessions. Click &quot;New Conversation&quot; to start.
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between group cursor-pointer border border-transparent transition-all ${
                          currentSessionId === session.id
                            ? "bg-indigo-50 border-indigo-100 text-indigo-900"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          {editingSessionId === session.id ? (
                            <input
                              type="text"
                              value={editTitleInput}
                              onChange={(e) => setEditTitleInput(e.target.value)}
                              onBlur={() => handleSaveRename(session.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(session.id);
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs outline-none"
                            />
                          ) : (
                            <div
                              className="text-xs font-bold truncate"
                              onDoubleClick={(e) => handleStartRename(session, e)}
                            >
                              {session.title}
                            </div>
                          )}
                          <div className="text-[9px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                            <span>{session.messageCount} messages</span>
                            {session.lastMessageAt && (
                              <>
                                <span>•</span>
                                <span>
                                  {new Date(session.lastMessageAt).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quick thread management icons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleStartRename(session, e)}
                            className="w-6 h-6 rounded-md hover:bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-600 border-none bg-transparent"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={(e) => handleArchiveSession(session.id, e)}
                            className="w-6 h-6 rounded-md hover:bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-red-500 border-none bg-transparent"
                          >
                            <span className="material-symbols-outlined text-base">archive</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer input area */}
      {activeTab === "chat" && (
        <div className="p-4 border-t border-slate-100 bg-white space-y-3 shrink-0">
          {/* Suggestion Chips */}
          {messages.length <= 1 && !loading && !fetchingHistory && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-100 px-3 py-1.5 rounded-full transition-all text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.coachPlaceholder}
              disabled={loading || fetchingHistory}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all placeholder-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || fetchingHistory}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 text-white disabled:text-slate-400 flex items-center justify-center transition-colors border-none shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
