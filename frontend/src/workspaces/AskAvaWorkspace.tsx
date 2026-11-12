import { useState, useEffect } from 'react';
import type { ChatResponse, ChatEvidenceItem, EvidenceEnvelope } from '../types';
import { api } from '../services/api';
import { SampleSizeBadge } from '../components/Badges';
import {
  Sparkles,
  Send,
  Database,
  Cpu,
  RefreshCw,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface AskAvaWorkspaceProps {
  nicheId?: string;
  nicheName: string;
}

interface ChatEntry {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  envelope?: EvidenceEnvelope<ChatResponse>;
}

export function AskAvaWorkspace({ nicheId, nicheName }: AskAvaWorkspaceProps) {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am **AVA**, your AI marketplace intelligence assistant for Indian apparel retail vendors. I am currently scoped strictly to **${nicheName}**.\n\nEvery figure I state is verified against our database tools with exact sample sizes. Ask me about pricing distributions, fabric trends, sizing gaps, or product opportunities!`,
      timestamp: '10:00 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [activeMode, setActiveMode] = useState<'gemini' | 'demo'>('demo');

  useEffect(() => {
    api.getAssistantStatus().then((st) => {
      if (st?.mode === 'gemini' || st?.mode === 'demo') {
        setActiveMode(st.mode);
      }
    }).catch(() => {});
  }, []);

  const suggestedQuestions = [
    'What is the median price in this niche?',
    'Which price band has the most listings?',
    'What is the brand count and who is the leader?',
    'Which fabrics and colours are most prevalent?',
    'What share of listings offer extended sizes (3XL+)?',
    'How many units did the top kurta sell last month?',
    'Can you share competitor revenue or buyer emails?',
  ];

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isAsking) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userEntry: ChatEntry = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userEntry]);
    setInputValue('');
    setIsAsking(true);

    try {
      const resp = await api.askAssistant({
        question: q,
        niche_id: nicheId,
      });

      const mode = resp?.data?.mode ?? (resp as any)?.mode ?? 'demo';
      setActiveMode(mode === 'gemini' ? 'gemini' : 'demo');

      const botText = resp?.data?.answer ?? (resp as any)?.answer ?? 'No response received.';

      const botEntry: ChatEntry = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        envelope: resp,
      };

      setMessages((prev) => [...prev, botEntry]);
    } catch (err: any) {
      const errorEntry: ChatEntry = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error contacting Ask AVA service: ${err.message || 'Unknown error'}. Please try again.`,
        timestamp: timeStr,
      };
      setMessages((prev) => [...prev, errorEntry]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Thread reset. Ready to answer grounded questions for **${nicheName}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#75777c] uppercase font-mono tracking-wider">
            <span>AI Copilot</span>
            <span>/</span>
            <span>Grounded Dialogue Engine</span>
            <span>/</span>
            <span className="text-[#8a5100] font-bold">Ask AVA</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#131b2e] mt-1 flex items-center gap-2">
            <Sparkles className="text-[#ff9900]" size={24} />
            Ask AVA Intelligence Assistant
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Grounded market query engine. Every metric is retrieved via read-only tools and verified against raw data.
          </p>
        </div>

        {/* Engine Mode Chip */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border font-mono ${
              activeMode === 'gemini'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {activeMode === 'gemini' ? (
              <>
                <Cpu size={13} className="text-purple-600" />
                <span>Gemini Live Engine</span>
              </>
            ) : (
              <>
                <Database size={13} className="text-[#8a5100]" />
                <span>Deterministic Demo Engine</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-400 font-mono">Scoped: {nicheName}</span>
        </div>
      </div>

      {/* Main Grid: Left Telemetry & Threads Sidebar (3 cols) + Right Chat (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Telemetry Sidebar (Exact Stitch Design) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Pinned Sourcing Inquiries */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777c] block">
              Sample Verification Queries
            </span>

            <div className="space-y-1.5">
              {suggestedQuestions.map((qText, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isAsking}
                  onClick={() => handleSend(qText)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-[#f2f3ff] text-xs font-medium text-gray-800 transition flex items-center justify-between group border border-transparent hover:border-[#dae2fd] cursor-pointer"
                >
                  <span className="line-clamp-1">{qText}</span>
                  <Sparkles size={12} className="text-gray-300 group-hover:text-[#ff9900] shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Grounding Box (Exact Stitch) */}
          <div className="p-4 bg-[#f2f3ff] rounded-xl border border-[#dae2fd] shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-[#131b2e]">
              <ShieldCheck size={18} className="text-[#8a5100]" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Telemetry Grounding
              </span>
            </div>

            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <div className="flex justify-between">
                <span>Active Scope:</span>
                <span className="font-bold text-[#131b2e] truncate max-w-[130px]">{nicheName}</span>
              </div>
              <div className="flex justify-between">
                <span>Tool Access:</span>
                <span className="font-bold text-[#131b2e]">Read-Only Whitelist</span>
              </div>
              <div className="flex justify-between">
                <span>Verifier Status:</span>
                <span className="font-bold text-emerald-700">Strict Match Active</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200/60 flex items-center gap-2 text-[11px] text-[#131b2e] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#fe9800] animate-pulse" />
              <span>Zero Hallucination Grounding</span>
            </div>
          </div>
        </aside>

        {/* Right Chat Thread & Input (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col overflow-hidden">
          {/* Conversation Header Bar */}
          <div className="h-12 px-4 bg-[#faf8ff] border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#75777c]">
                Copilot
              </span>
              <span>/</span>
              <span className="font-bold text-[#131b2e]">Sourcing & Market Corridors</span>
              <span className="px-1.5 py-0.5 rounded bg-[#f2f3ff] text-gray-500 font-mono text-[10px]">
                v4.18 Commerce Pro
              </span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-black font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Clear Thread</span>
            </button>
          </div>

          {/* Chat Messages Scrollable Box */}
          <div className="p-5 min-h-[440px] max-h-[580px] overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const envelope = msg.envelope;
              const chatData = envelope?.data ?? (envelope as any);
              const evidence: ChatEvidenceItem[] = chatData?.evidence || [];
              const limitations: string[] = chatData?.limitations || [];
              const followUps: string[] = chatData?.follow_up_suggestions || [];

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono px-1">
                    {isUser ? (
                      <span>You · {msg.timestamp}</span>
                    ) : (
                      <span className="font-bold text-[#8a5100]">AVA Copilot · {msg.timestamp}</span>
                    )}
                  </div>

                  {/* Message Bubble (Exact Stitch Style) */}
                  <div
                    className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#161c24] text-white shadow-sm'
                        : 'bg-[#faf8ff] text-[#131b2e] border border-[#e2e8f0] shadow-sm'
                    }`}
                  >
                    {msg.text}

                    {/* Grounded Evidence Cards */}
                    {evidence.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777c] block">
                          Grounded Empirical Evidence (from database tools):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {evidence.map((ev: ChatEvidenceItem, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white p-2.5 rounded-lg border border-[#e2e8f0] text-[11px] space-y-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-800 capitalize">
                                  {ev.metric.replace('_', ' ')}
                                </span>
                                <SampleSizeBadge n={ev.n} minThreshold={30} />
                              </div>
                              <div className="font-mono font-bold text-[#131b2e] text-xs">
                                {String(ev.value)}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">Tool: {ev.tool}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Limitations & Disclaimers */}
                    {limitations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-200 text-[10px] text-gray-500 space-y-0.5 font-sans">
                        <span className="font-bold text-gray-700 block">Guardrails & Limitations:</span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {limitations.map((lim, lIdx) => (
                            <li key={lIdx}>{lim}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Follow-up Chips */}
                    {followUps.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-200 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5100] block">
                          Suggested Analytical Follow-Ups:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {followUps.map((fu, fIdx) => (
                            <button
                              key={fIdx}
                              type="button"
                              onClick={() => handleSend(fu)}
                              className="text-[11px] bg-white border border-[#ff9900]/40 hover:bg-[#ffdcbd] text-[#2c1600] px-2.5 py-0.5 rounded transition cursor-pointer font-medium"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAsking && (
              <div className="flex items-center gap-2 text-xs text-gray-500 p-2 font-mono">
                <RefreshCw size={14} className="animate-spin text-[#ff9900]" />
                <span>Calling database tools and verifying evidence...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="p-3 bg-[#faf8ff] border-t border-[#e2e8f0] flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask AVA about pricing sweet spots, sizing gaps, dominant colors..."
              value={inputValue}
              disabled={isAsking}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 text-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#ff9900] bg-white"
            />
            <button
              type="submit"
              disabled={isAsking || !inputValue.trim()}
              className="px-5 py-3 bg-[#ff9900] hover:bg-[#f08800] disabled:opacity-40 text-[#131921] font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send size={15} />
              <span>Ask AVA</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
