"use client";
import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";

// ============================================
// CONFIG
// ============================================
const WEBHOOK_URL = "http://localhost:5678/webhook/chatbot-gesneu";
const BOT_NAME = "GesntIA";
const SESSION_PREFIX = "gesneu-";

// Genera un sessionId único por navegador
function getSessionId() {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("gesneu_session");
  if (!id) {
    id = SESSION_PREFIX + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("gesneu_session", id);
  }
  return id;
}

// ============================================
// SUGERENCIAS — enfocadas en predicción
// ============================================
const SUGGESTION_GROUPS = [
  {
    title: "Predicciones",
    icon: "📊",
    items: [
      "¿Cuándo necesitará cambio la placa BTS-803?",
      "¿Qué neumáticos están por acabarse en los próximos 30 días?",
      "Proyección de costos de neumáticos para el próximo trimestre",
    ],
  },
  {
    title: "Análisis",
    icon: "🔍",
    items: [
      "¿Qué marca de neumático dura más en nuestra flota?",
      "Comparar el desgaste entre Michelin y Bridgestone",
      "¿Qué placa tiene el mayor desgaste anormal?",
    ],
  },
  {
    title: "Estado actual",
    icon: "🚛",
    items: [
      "Estado de neumáticos de la placa BTS-803",
      "¿Hay neumáticos críticos ahora?",
      "Stock disponible en almacén",
    ],
  },
];

// ============================================
// CHART RENDERER
// ============================================
function ChartBlock({ config }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const loadChart = async () => {
      try {
        const mod = await import(
          /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm"
        );
        const Chart = mod.Chart;
        const registerables = mod.registerables || [];
        if (registerables.length) Chart.register(...registerables);
        if (chartRef.current) chartRef.current.destroy();
        if (!canvasRef.current) return;

        const defaults = [
          "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
          "#8b5cf6", "#14b8a6", "#ec4899", "#f97316",
        ];
        const colors = config.colors || defaults.slice(0, config.labels?.length || 4);

        chartRef.current = new Chart(canvasRef.current, {
          type: config.type || "bar",
          data: {
            labels: config.labels || [],
            datasets: [
              {
                data: config.data || [],
                backgroundColor: colors,
                borderRadius: config.type === "bar" ? 6 : 0,
                borderWidth: ["pie", "doughnut"].includes(config.type) ? 2 : 0,
                borderColor: "#1a1f2e",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: config.horizontal ? "y" : "x",
            plugins: {
              legend: {
                display: ["pie", "doughnut"].includes(config.type),
                position: "bottom",
                labels: { boxWidth: 10, padding: 12, font: { size: 11 }, color: "#94a3b8" },
              },
            },
            scales: ["pie", "doughnut"].includes(config.type)
              ? {}
              : {
                x: { grid: { color: "#1e293b" }, ticks: { font: { size: 10 }, color: "#64748b" } },
                y: { grid: { color: "#1e293b" }, ticks: { font: { size: 10 }, color: "#64748b" } },
              },
          },
        });
      } catch (e) {
        console.error("Chart error:", e);
      }
    };
    loadChart();
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [config]);

  return (
    <div style={{ position: "relative", width: "100%", height: 200, margin: "12px 0" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ============================================
// BOT MESSAGE RENDERER — HTML + Charts
// ============================================
function BotMessage({ text }) {
  const chartRegex = /<!--chart:(.*?)-->/g;
  const charts = [];
  let match;
  while ((match = chartRegex.exec(text)) !== null) {
    try {
      charts.push(JSON.parse(match[1]));
    } catch (e) { }
  }
  const htmlContent = text.replace(chartRegex, "").trim();
  const isHtml = /<[a-z][\s\S]*>/i.test(htmlContent);

  return (
    <>
      {isHtml ? (
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      ) : (
        <span style={{ whiteSpace: "pre-wrap" }}>{htmlContent}</span>
      )}
      {charts.map((cfg, i) => (
        <ChartBlock key={i} config={cfg} />
      ))}
    </>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagen, setImagen] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const sessionId = useRef(typeof window !== "undefined" ? getSessionId() : "server");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = useCallback(
    async (text) => {
      const msg = text || input.trim();
      if (!msg || loading) return;

      setInput("");
      setShowWelcome(false);
      const userMsg = { role: "user", text: msg, time: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const body = {
          mensaje: msg,
          sessionId: sessionId.current,
        };
        if (imagen) {
          body.imagen = imagen;
          setImagen(null);
        }

        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        const respuesta = data.respuesta || "No pude obtener una respuesta.";
        setMessages((prev) => [...prev, { role: "bot", text: respuesta, time: new Date() }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Error de conexión con el servidor. Verifica que n8n esté corriendo.", time: new Date() },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, imagen]
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const formatTime = (d) =>
    d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
    // Reset session para limpiar memoria del AI Agent
    const newId = SESSION_PREFIX + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("gesneu_session", newId);
    sessionId.current = newId;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

        .chat-page {
          display: flex; flex-direction: column; height: 100vh;
          background: #0c0f1a; color: #e2e8f0;
          font-family: 'Outfit', sans-serif;
        }

        /* HEADER */
        .chat-header {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 28px; border-bottom: 1px solid #1a1f35;
          background: #0c0f1a;
        }
        .chat-logo {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700; font-size: 14px; color: #fff;
          letter-spacing: -0.5px;
        }
        .chat-header-info h1 {
          margin: 0; font-size: 17px; font-weight: 600;
          color: #f1f5f9; letter-spacing: -0.3px;
        }
        .chat-header-info p {
          margin: 2px 0 0; font-size: 12px; color: #475569;
        }
        .chat-header-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #22c55e; margin-left: 16px;
        }
        .chat-header-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e; animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,.4); }
          50% { opacity: .7; box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        .chat-clear-btn {
          margin-left: auto; padding: 7px 16px; border-radius: 8px;
          border: 1px solid #1e293b; background: transparent;
          color: #64748b; font-size: 12px; cursor: pointer;
          font-family: 'Outfit', sans-serif; transition: all .15s;
        }
        .chat-clear-btn:hover { background: #1e293b; color: #94a3b8; }

        /* MESSAGES AREA */
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 24px 0;
          scroll-behavior: smooth;
        }
        .chat-messages::-webkit-scrollbar { width: 5px; }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #1e293b; border-radius: 10px;
        }
        .chat-msg-wrap {
          max-width: 780px; margin: 0 auto; padding: 0 28px;
        }

        /* MESSAGE BUBBLES */
        .chat-msg {
          display: flex; gap: 12px; margin-bottom: 20px;
          animation: msgIn .3s ease-out;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-msg-bot { flex-direction: row; }
        .chat-msg-user { flex-direction: row-reverse; }

        .chat-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
          margin-top: 2px;
        }
        .chat-avatar-bot {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: #fff; font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: -0.5px;
        }
        .chat-avatar-user {
          background: #1e293b; color: #94a3b8;
        }

        .chat-bubble {
          padding: 14px 18px; border-radius: 16px;
          font-size: 14px; line-height: 1.6; max-width: 85%;
          word-break: break-word;
        }
        .chat-bubble-bot {
          background: #131827; border: 1px solid #1a1f35;
          border-top-left-radius: 4px; color: #cbd5e1;
        }
        .chat-bubble-user {
          background: #1e3a5f; border: 1px solid #1e4d80;
          border-top-right-radius: 4px; color: #e2e8f0;
          white-space: pre-wrap;
        }
        .chat-msg-time {
          font-size: 10px; color: #334155; margin-top: 4px;
          padding: 0 4px;
        }
        .chat-msg-user .chat-msg-time { text-align: right; }

        /* HTML CONTENT STYLES */
        .chat-bubble-bot table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          font-size: 12px; margin: 10px 0; border-radius: 10px;
          overflow: hidden; border: 1px solid #1e293b;
        }
        .chat-bubble-bot thead { background: #0f172a; }
        .chat-bubble-bot th {
          padding: 9px 12px; text-align: left; font-weight: 600;
          color: #94a3b8; font-size: 10px; text-transform: uppercase;
          letter-spacing: .05em; border-bottom: 2px solid #1e293b;
        }
        .chat-bubble-bot td {
          padding: 8px 12px; border-bottom: 1px solid #1a1f35;
          color: #cbd5e1; font-size: 12.5px;
        }
        .chat-bubble-bot tbody tr:last-child td { border-bottom: none; }
        .chat-bubble-bot tbody tr:hover { background: #0f172a; }

        .chat-bubble-bot .card {
          background: #0f172a; border: 1px solid #1e293b;
          border-radius: 10px; padding: 12px 16px; margin: 8px 0;
        }
        .chat-bubble-bot .card .row {
          display: flex; justify-content: space-between;
          padding: 5px 0; border-bottom: 1px solid #1a1f35;
        }
        .chat-bubble-bot .card .row:last-child { border: none; }
        .chat-bubble-bot .card .label {
          font-size: 12px; color: #64748b; font-weight: 500;
        }
        .chat-bubble-bot .card .value {
          font-size: 12.5px; color: #e2e8f0; font-weight: 600;
        }

        .chat-bubble-bot .badge {
          display: inline-block; padding: 2px 10px; border-radius: 10px;
          font-size: 11px; font-weight: 600;
        }
        .chat-bubble-bot .badge.danger {
          background: #3b1111; color: #f87171; border: 1px solid #5c1d1d;
        }
        .chat-bubble-bot .badge.warning {
          background: #3b2e0a; color: #fbbf24; border: 1px solid #5c4a12;
        }
        .chat-bubble-bot .badge.success {
          background: #0b3d1e; color: #4ade80; border: 1px solid #145c30;
        }

        .chat-bubble-bot .bar {
          width: 100%; height: 6px; background: #1e293b;
          border-radius: 3px; overflow: hidden; margin: 4px 0;
        }
        .chat-bubble-bot .bar .fill {
          height: 100%; border-radius: 3px;
        }
        .chat-bubble-bot strong { color: #f1f5f9; }
        .chat-bubble-bot p { margin: 4px 0; }
        .chat-bubble-bot a { color: #60a5fa; }

        /* TYPING INDICATOR */
        .chat-typing {
          display: flex; gap: 5px; padding: 14px 18px;
          background: #131827; border: 1px solid #1a1f35;
          border-radius: 16px; border-top-left-radius: 4px;
          width: fit-content;
        }
        .chat-typing-dot {
          width: 7px; height: 7px; background: #475569;
          border-radius: 50%; animation: bounce 1.2s infinite;
        }
        .chat-typing-dot:nth-child(2) { animation-delay: .15s; }
        .chat-typing-dot:nth-child(3) { animation-delay: .3s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        /* WELCOME SCREEN */
        .chat-welcome {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 28px; overflow-y: auto;
        }
        .chat-welcome-logo {
          width: 72px; height: 72px; border-radius: 20px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700; font-size: 22px; color: #fff;
          margin-bottom: 20px; letter-spacing: -1px;
        }
        .chat-welcome h2 {
          margin: 0; font-size: 26px; font-weight: 600;
          color: #f1f5f9; text-align: center; letter-spacing: -0.5px;
        }
        .chat-welcome p {
          margin: 8px 0 32px; font-size: 14px; color: #475569;
          text-align: center; max-width: 440px; line-height: 1.6;
        }
        .chat-sug-groups {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 16px; max-width: 780px; width: 100%;
        }
        @media (max-width: 768px) {
          .chat-sug-groups { grid-template-columns: 1fr; }
        }
        .chat-sug-group {
          background: #131827; border: 1px solid #1a1f35;
          border-radius: 14px; padding: 18px; transition: all .2s;
        }
        .chat-sug-group:hover { border-color: #1e3a5f; }
        .chat-sug-group-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: #94a3b8;
          margin-bottom: 12px;
        }
        .chat-sug-item {
          display: block; width: 100%; text-align: left;
          background: none; border: none; padding: 9px 12px;
          border-radius: 8px; font-size: 12.5px; color: #64748b;
          cursor: pointer; font-family: 'Outfit', sans-serif;
          line-height: 1.4; transition: all .15s; margin-bottom: 4px;
        }
        .chat-sug-item:hover {
          background: #1e293b; color: #cbd5e1;
        }

        /* INPUT AREA */
        .chat-input-area {
          padding: 16px 28px 20px; border-top: 1px solid #1a1f35;
          background: #0c0f1a;
        }
        .chat-input-wrap {
          max-width: 780px; margin: 0 auto;
          display: flex; gap: 10px; align-items: flex-end;
        }
        .chat-input {
          flex: 1; background: #131827; border: 1px solid #1a1f35;
          border-radius: 14px; padding: 13px 18px; font-size: 14px;
          color: #e2e8f0; resize: none; outline: none;
          font-family: 'Outfit', sans-serif; max-height: 100px;
          line-height: 1.5; transition: border-color .15s;
        }
        .chat-input::placeholder { color: #334155; }
        .chat-input:focus { border-color: #3b82f6; }

        .chat-icon-btn {
          width: 44px; height: 44px; border-radius: 12px;
          border: 1px solid #1a1f35; background: #131827;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; transition: all .15s;
        }
        .chat-icon-btn:hover { border-color: #1e3a5f; background: #1e293b; }
        .chat-icon-btn svg { width: 18px; height: 18px; }

        .chat-send-btn {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border: none; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          flex-shrink: 0; transition: all .15s;
        }
        .chat-send-btn:disabled { opacity: .3; cursor: default; }
        .chat-send-btn:not(:disabled):hover { transform: scale(1.05); }
        .chat-send-btn svg { width: 18px; height: 18px; fill: #fff; }

        .chat-img-preview {
          max-width: 780px; margin: 0 auto 8px;
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; background: #131827;
          border: 1px solid #1a1f35; border-radius: 10px;
          font-size: 12px; color: #60a5fa;
        }
        .chat-img-remove {
          background: none; border: none; color: #ef4444;
          cursor: pointer; font-size: 16px; margin-left: auto;
          font-family: 'Outfit', sans-serif;
        }

        .chat-footer-note {
          max-width: 780px; margin: 8px auto 0;
          font-size: 10px; color: #1e293b; text-align: center;
        }
      `}</style>

      <div className="chat-page">
        {/* HEADER */}
        <div className="chat-header">
          <div className="chat-logo">Gn</div>
          <div className="chat-header-info">
            <h1>{BOT_NAME}</h1>
            <p>Asistente predictivo de neumáticos — TAIR Renting</p>
          </div>
          <div className="chat-header-status">
            <span className="chat-header-dot" />
            En línea
          </div>
          <button className="chat-clear-btn" onClick={clearChat}>
            Limpiar chat
          </button>
        </div>

        {/* WELCOME or MESSAGES */}
        {showWelcome && messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-logo">Gn</div>
            <h2>¿Qué necesitas saber de tu flota?</h2>
            <p>
              Puedo predecir cuándo necesitarás cambiar neumáticos, analizar qué
              marcas rinden más, proyectar costos y detectar problemas antes de
              que ocurran.
            </p>
            <div className="chat-sug-groups">
              {SUGGESTION_GROUPS.map((g, gi) => (
                <div key={gi} className="chat-sug-group">
                  <div className="chat-sug-group-title">
                    <span>{g.icon}</span>
                    {g.title}
                  </div>
                  {g.items.map((s, si) => (
                    <button
                      key={si}
                      className="chat-sug-item"
                      onClick={() => send(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            <div className="chat-msg-wrap">
              {messages.map((m, i) => {
                const isBot = m.role === "bot";
                const isHtml =
                  isBot &&
                  (/<[a-z][\s\S]*>/i.test(m.text) ||
                    /<!--chart:/.test(m.text));
                return (
                  <div
                    key={i}
                    className={`chat-msg ${isBot ? "chat-msg-bot" : "chat-msg-user"}`}
                  >
                    <div
                      className={`chat-avatar ${isBot ? "chat-avatar-bot" : "chat-avatar-user"}`}
                    >
                      {isBot ? "Gn" : "Tú"}
                    </div>
                    <div>
                      <div
                        className={`chat-bubble ${isBot ? "chat-bubble-bot" : "chat-bubble-user"}`}
                      >
                        {isBot ? <BotMessage text={m.text} /> : m.text}
                      </div>
                      <div className="chat-msg-time">
                        {formatTime(m.time)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="chat-msg chat-msg-bot">
                  <div className="chat-avatar chat-avatar-bot">Gn</div>
                  <div className="chat-typing">
                    <div className="chat-typing-dot" />
                    <div className="chat-typing-dot" />
                    <div className="chat-typing-dot" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>
        )}

        {/* INPUT */}
        <div className="chat-input-area">
          {imagen && (
            <div className="chat-img-preview">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Imagen lista para analizar
              <button
                className="chat-img-remove"
                onClick={() => setImagen(null)}
              >
                ×
              </button>
            </div>
          )}
          <div className="chat-input-wrap">
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Pregunta sobre predicciones, análisis o estado de tu flota..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <div className="chat-footer-note">
            GesntIA puede cometer errores. Verifica la información importante.
          </div>
        </div>
      </div>
    </>
  );
}
