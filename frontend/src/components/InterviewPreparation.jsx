// src/components/InterviewPreparation.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function InterviewPreparation() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeStatus, setResumeStatus] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/interview-agent/extract-document`,
        formData,
        {
          headers: {
            ...getAuthHeader().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setDocumentText(res.data.extracted_text);
      setUploadedFileName(res.data.filename);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: `📄 Document "${res.data.filename}" extracted successfully! The agent now has access to this content.`,
        },
      ]);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to extract text from the document.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (customPrompt = null) => {
    const promptToSend = customPrompt || inputMessage;
    if (!promptToSend.trim()) return;

    const userMsg = { sender: 'user', text: promptToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/interview-agent/chat`,
        {
          message: promptToSend,
          target_role: targetRole || undefined,
          document_text: documentText || undefined,
        },
        getAuthHeader()
      );

      setResumeStatus(res.data.resume_found ? 'Active Resume' : 'Fallback Profile');
      setMessages((prev) => [
        ...prev,
        { sender: 'agent', text: res.data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: err.response?.data?.detail || 'An error occurred while reaching the Interview Agent.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          AI Interview Preparation Agent
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Generate project-grounded interview questions, role recommendations, and custom Q&A.
        </p>
      </div>

      {/* Role & Actions Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Target Role:
          </label>
          <input
            type="text"
            placeholder="e.g. Java Developer, Cloud Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {resumeStatus && (
            <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full whitespace-nowrap">
              Context: {resumeStatus}
            </span>
          )}
        </div>

        {/* Action Preset Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
          <button
            onClick={() => sendMessage('Which internship roles are suitable for me based on my resume?')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            Recommend Roles
          </button>
          <button
            onClick={() => sendMessage('What are my strongest technical skills based on my projects?')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            Strongest Skills
          </button>
          <button
            onClick={() => sendMessage('Generate technical interview questions based on my projects.')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            Technical Questions
          </button>
          <button
            onClick={() => sendMessage('Generate HR and behavioral interview questions for my profile.')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            HR Questions
          </button>
          <button
            onClick={() => sendMessage('Provide a step-by-step interview preparation roadmap for me.')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            Prep Roadmap
          </button>
        </div>
      </div>

      {/* Document Upload Area */}
      <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            Upload Document (PDF/DOCX) for Context:
          </span>
          {uploadedFileName && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ✓ {uploadedFileName}
            </span>
          )}
        </div>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleDocumentUpload}
          className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
        />
      </div>

      {/* Chat Conversation Box */}
      <div className="border border-slate-200 rounded-2xl p-5 min-h-[380px] max-h-[550px] overflow-y-auto space-y-4 bg-slate-50/30 shadow-inner">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-xs font-medium">
              Click any quick button above or type a prompt to start preparing for your interview.
            </p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, index) => (
            <div
              key={index}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                {m.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <div className="prose prose-invert max-w-none text-sm space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-600 [&_th]:p-2 [&_td]:border [&_td]:border-gray-700 [&_td]:p-2">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Interview Agent is analyzing...
          </div>
        )}
      </div>

      {/* Message Input Box */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Ask a question about project topics, answer strategy, or document details..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 px-4 py-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}