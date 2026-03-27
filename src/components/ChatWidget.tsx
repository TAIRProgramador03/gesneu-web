import React, { useState, useRef, useEffect } from 'react'


const SUGGESTIONS = [
  "¿Qué neumáticos tiene la placa BTS-803?",
  "¿Hay neumáticos con remanente bajo?",
  "¿Qué hay en almacén?",
  "Stock por marca",
];


export const ChatWidget = () => {

  const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? 'http://localhost:5678/webhook-test/chatbot';


  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hola, soy el asistente de gestión de neumáticos. ¿En qué puedo ayudarte?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text = '') => {
    const msg = text.trim().length === 0 ? input.trim() : text;
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.respuesta || "No pude obtener una respuesta." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

        .cw-float {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: 'DM Sans', sans-serif;
        }

        .cw-bubble {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 0 0 0 rgba(15,23,42,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cw-bubble:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 32px rgba(0,0,0,0.25);
        }
        .cw-bubble svg { width: 26px; height: 26px; fill: white; }

        .cw-window {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 400px;
          max-width: calc(100vw - 32px);
          height: 560px;
          max-height: calc(100vh - 120px);
          background: #fafafa;
          border-radius: 20px;
          box-shadow: 0 12px 60px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: cw-slideUp 0.25s ease-out;
          font-family: 'DM Sans', sans-serif;
          z-index: 9999;
        }

        @keyframes cw-slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cw-header {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          color: white;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cw-header-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cw-header-icon svg { width: 20px; height: 20px; fill: white; }
        .cw-header-info h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .cw-header-info p {
          margin: 2px 0 0;
          font-size: 12px;
          opacity: 0.7;
          font-weight: 400;
        }
        .cw-close {
          margin-left: auto;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: background 0.15s;
        }
        .cw-close:hover { background: rgba(255,255,255,0.2); }

        .cw-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scroll-behavior: smooth;
        }
        .cw-messages::-webkit-scrollbar { width: 5px; }
        .cw-messages::-webkit-scrollbar-track { background: transparent; }
        .cw-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }

        .cw-msg {
          max-width: 82%;
          padding: 11px 15px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .cw-msg-bot {
          background: white;
          color: #1e293b;
          align-self: flex-start;
          border: 1px solid #e8eaed;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .cw-msg-user {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .cw-typing {
          display: flex;
          gap: 5px;
          padding: 12px 16px;
          align-self: flex-start;
          background: white;
          border: 1px solid #e8eaed;
          border-radius: 16px;
          border-bottom-left-radius: 4px;
        }
        .cw-dot {
          width: 7px;
          height: 7px;
          background: #94a3b8;
          border-radius: 50%;
          animation: cw-bounce 1.2s infinite;
        }
        .cw-dot:nth-child(2) { animation-delay: 0.15s; }
        .cw-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes cw-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        .cw-suggestions {
          padding: 0 16px 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .cw-sug {
          background: white;
          border: 1px solid #e2e5e9;
          border-radius: 20px;
          padding: 6px 13px;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .cw-sug:hover {
          background: #f0f4ff;
          border-color: #93b4f5;
          color: #1e3a5f;
        }

        .cw-input-area {
          padding: 12px 16px;
          border-top: 1px solid #eef0f2;
          display: flex;
          gap: 8px;
          align-items: flex-end;
          background: white;
        }
        .cw-input {
          flex: 1;
          border: 1.5px solid #e2e5e9;
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          resize: none;
          outline: none;
          max-height: 80px;
          line-height: 1.4;
          transition: border-color 0.15s;
          background: #fafafa;
          color: #1e293b;
        }
        .cw-input::placeholder { color: #94a3b8; }
        .cw-input:focus { border-color: #6b9cf7; background: white; }

        .cw-send {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.1s;
        }
        .cw-send:disabled { opacity: 0.4; cursor: default; }
        .cw-send:not(:disabled):hover { transform: scale(1.05); }
        .cw-send svg { width: 18px; height: 18px; fill: white; }
      `}</style>

      <div className="cw-float">
        {!open && (
          <button className="cw-bubble" onClick={() => setOpen(true)}>
            <svg viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
          </button>
        )}

        {open && (
          <div className="cw-window">
            <div className="cw-header">
              <div className="cw-header-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                </svg>
              </div>
              <div className="cw-header-info">
                <h3>Asistente de neumáticos</h3>
                <p>Consulta información de tu flota</p>
              </div>
              <button className="cw-close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="cw-messages">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`cw-msg ${m.role === "bot" ? "cw-msg-bot" : "cw-msg-user"}`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="cw-typing">
                  <div className="cw-dot" />
                  <div className="cw-dot" />
                  <div className="cw-dot" />
                </div>
              )}
              <div ref={endRef} />
            </div>

            {messages.length <= 1 && !loading && (
              <div className="cw-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="cw-sug" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="cw-input-area">
              <textarea
                ref={inputRef}
                className="cw-input"
                placeholder="Escribe tu consulta..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => handleKey}
                disabled={loading}
              />
              <button
                className="cw-send"
                onClick={() => send()}
                disabled={!input.trim() || loading}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
