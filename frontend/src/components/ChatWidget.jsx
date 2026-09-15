import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import BotIcon from './BotIcon';

export default function ChatWidget({ userId }) {
  const activeUserId= userId || "guest"; // Default user ID if not provided
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState("sess_101");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userQuery = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: activeUserId,
          session_id: sessionId,
          message: userQuery
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Failed to connect to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
  onClick={() => setIsOpen(true)}
  className="p-1 rounded-full shadow-xl hover:scale-105 transition-transform duration-200"
  aria-label="Open Chat"
>
          {/* Custom Floating Bot Icon */}
          <BotIcon className="w-14 h-14" />
        </button>
      ) : (
        <div className="w-80 sm:w-96 h-[460px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 font-bold text-sm flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BotIcon className="w-6 h-6 text-white" filled={true} />
              <span>Product Assistant Chatbot</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl text-xs max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {m.role === 'user' ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400">Thinking...</div>}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              className="flex-1 border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="Ask a question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}