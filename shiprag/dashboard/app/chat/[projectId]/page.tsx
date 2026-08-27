"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const API_URL = "/backend-api";


interface SourceChunk {
  source: string;
  content: string;
  similarity: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  timestamp: string;
}

export default function ChatPlayground({ params }: { params: { projectId: string } }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Welcome to the live RAG playground for **${params.projectId}**.\n\nYou can ask any question about the codebase, documentation, or architecture, and I will retrieve grounded context and answer in real-time.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useHybrid, setUseHybrid] = useState(true);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.3);
  const [activeTab, setActiveTab] = useState<"chat" | "inspector">("chat");
  const [lastRetrievedSources, setLastRetrievedSources] = useState<SourceChunk[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function executeQuery() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsgId = "u-" + Date.now();
    const assistantMsgId = "a-" + Date.now();

    const newMsg: Message = {
      id: userMsgId,
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const pendingAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg, pendingAssistantMsg]);
    setInput("");
    setLoading(true);


    try {
      const response = await fetch("http://localhost:8000/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: params.projectId,
          question: userText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: data.answer || "No response received.",
                  sources: data.sources || [],
                }
              : msg
          )
        );
        if (data.sources) setLastRetrievedSources(data.sources);
      } else {
        const errJson = await response.json().catch(() => ({}));
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ Backend Error (${response.status}): ${errJson.detail || "Could not query repository."}`,
                }
              : msg
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `⚠️ Connection Error: Could not reach backend server at http://localhost:8000. Details: ${err.message}`,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }

  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeQuery();
    }
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", color: "#f0f6fc" }}>
      {/* Sidebar / Configuration Drawer */}
      <aside style={{
        width: "320px",
        background: "#12161f",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Link href="/" style={{ color: "#8b949e", fontSize: "0.85rem" }}>
              ← Back to Pipelines
            </Link>
          </div>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "4px", color: "#ffffff" }}>
            {params.projectId}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Link
              href="/dashboard/repositories"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontSize: "0.78rem",
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              + Ingest Repository
            </Link>
          </div>


          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{
              background: "#181d27",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginBottom: "4px" }}>
                Grounded Hybrid Index
              </div>
              <p style={{ fontSize: "0.78rem", color: "#8b949e", lineHeight: 1.4, margin: 0 }}>
                1024D Dense vector similarity + BM25 keyword matching across indexed repository files.
              </p>
            </div>
          </div>
        </div>

        <div style={{ fontSize: "0.75rem", color: "#57606a", textAlign: "center" }}>
          Engine: NVIDIA Llama 3.3 + NV-Embed-QA
        </div>
      </aside>

      {/* Main Playground Chat Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0a0c10" }}>
        {/* Chat Nav Header */}
        <div style={{
          padding: "12px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#12161f"
        }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                background: activeTab === "chat" ? "#181d27" : "transparent",
                color: activeTab === "chat" ? "#ffffff" : "#8b949e",
                border: "1px solid",
                borderColor: activeTab === "chat" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              💬 Chat Stream
            </button>
            <button
              onClick={() => setActiveTab("inspector")}
              style={{
                background: activeTab === "inspector" ? "#181d27" : "transparent",
                color: activeTab === "inspector" ? "#ffffff" : "#8b949e",
                border: "1px solid",
                borderColor: activeTab === "inspector" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              🔍 Vector Context Inspector ({lastRetrievedSources.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Chat Stream */}
        {activeTab === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    maxWidth: "75%",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    background: msg.role === "user" ? "#6366f1" : "rgba(22, 27, 34, 0.8)",
                    color: "#ffffff",
                    border: msg.role === "user" ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: msg.role === "user" ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                    fontSize: "0.95rem"
                  }}>
                    {msg.content || (loading ? "⚡ Thinking & retrieving vector chunks..." : "")}

                    {/* Sources snippet inside message bubble */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.8rem" }}>
                        <div style={{ fontWeight: 600, color: "#06b6d4", marginBottom: "6px" }}>
                          📚 Verified Citations ({msg.sources.length}):
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {msg.sources.map((s, idx) => (
                            <span
                              key={idx}
                              title={s.content}
                              style={{
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                color: "#8b949e"
                              }}
                            >
                              📄 {s.source} ({(s.similarity * 100).toFixed(0)}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#57606a", marginTop: "4px", padding: "0 4px" }}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{
              padding: "20px 24px",
              background: "#12161f",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              gap: "12px",
              position: "relative",
              zIndex: 30
            }}>
              <input
                type="text"
                placeholder="Ask anything about this repository or documentation..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  background: "#0a0c10",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={() => {
                  console.log("Send clicked, query:", input);
                  executeQuery();
                }}
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0 24px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
                  transition: "all 0.2s",
                  minWidth: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {loading ? "Thinking..." : "Send ↵"}
              </button>
            </div>

          </>
        )}

        {/* Tab 2: Vector Context Inspector */}
        {activeTab === "inspector" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", color: "#ffffff" }}>
              Retrieved pgvector & BM25 Context Chunks
            </h3>
            <p style={{ color: "#8b949e", fontSize: "0.9rem", marginBottom: "20px" }}>
              These are the raw document chunks extracted and fed into the context window for the latest prompt.
            </p>

            {lastRetrievedSources.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#57606a", border: "1px dashed rgba(255, 255, 255, 0.1)", borderRadius: "10px" }}>
                No search queries run yet. Ask a question in the chat tab to inspect vector chunk retrieval.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {lastRetrievedSources.map((chunk, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(22, 27, 34, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "16px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600, color: "#06b6d4", fontSize: "0.9rem" }}>
                        #{i + 1} Source: {chunk.source}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#10b981", fontFamily: "monospace" }}>
                        Similarity: {(chunk.similarity * 100).toFixed(2)}%
                      </span>
                    </div>
                    <pre style={{
                      whiteSpace: "pre-wrap",
                      background: "#0a0c10",
                      padding: "12px",
                      borderRadius: "6px",
                      color: "#8b949e",
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                      fontFamily: "monospace"
                    }}>
                      {chunk.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
