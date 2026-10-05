import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession, ChatMessage } from '../types';
import { getPlatformConfig, formatTimeOnly, formatRupiah } from '../utils/formatters';
import {
  Send,
  MessageSquareQuote,
  ShoppingBag,
  Truck,
  ArrowLeft,
  Sparkles,
  Zap,
  CheckCheck,
  Package,
} from 'lucide-react';
import { QuickRepliesModal } from './QuickRepliesModal';
import { ProductCatalogModal } from './ProductCatalogModal';
import { ShippingCalculatorModal } from './ShippingCalculatorModal';

interface ChatWorkspaceProps {
  session: ChatSession | null;
  messages: ChatMessage[];
  loadingMessages: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onBackToList?: () => void;
  onToggleProfile?: () => void;
  showProfileToggle?: boolean;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  session,
  messages,
  loadingMessages,
  onSendMessage,
  onBackToList,
  onToggleProfile,
  showProfileToggle,
}) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Modal states
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when session changes
  useEffect(() => {
    if (session) {
      inputRef.current?.focus();
    }
  }, [session?.id]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText;
    setInputText('');
    setSending(true);
    try {
      await onSendMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(text); // restore on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectTemplate = async (templateText: string, sendImmediately = false) => {
    if (sendImmediately) {
      setSending(true);
      try {
        await onSendMessage(templateText);
      } finally {
        setSending(false);
      }
    } else {
      setInputText(templateText);
      inputRef.current?.focus();
    }
  };

  const handleSendProductCard = async (payload: string) => {
    setSending(true);
    try {
      await onSendMessage(payload);
    } finally {
      setSending(false);
    }
  };

  const handleSendShippingQuote = async (quote: string) => {
    setSending(true);
    try {
      await onSendMessage(quote);
    } finally {
      setSending(false);
    }
  };

  // Render rich message content
  const renderMessageBody = (body: string, isCS: boolean) => {
    // 1. Structured Product Card
    if (body.startsWith('[PRODUK_KATALOG]')) {
      try {
        const jsonStr = body.replace('[PRODUK_KATALOG]', '');
        const data = JSON.parse(jsonStr);
        return (
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-2.5 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  {data.category || 'Katalog'}
                </span>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">{data.name}</h5>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[9px]">WARNA</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.color}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[9px]">UKURAN</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.size}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[9px]">HARGA</span>
                <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(data.price)}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{data.sku}</span>
            </div>
          </div>
        );
      } catch (e) {
        return <p className="text-xs leading-relaxed">{body}</p>;
      }
    }

    // 2. Structured Shipping Quote Card
    if (body.startsWith('[CEK_ONGKIR]')) {
      try {
        const textClean = body.replace('[CEK_ONGKIR]', '').trim();
        return (
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl p-3 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-1.5 max-w-xs font-mono text-xs">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold pb-1 border-b border-slate-100 dark:border-slate-800">
              <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Estimasi Ongkos Kirim</span>
            </div>
            <pre className="font-sans whitespace-pre-wrap text-[11px] text-slate-600 dark:text-slate-300">
              {textClean}
            </pre>
          </div>
        );
      } catch (e) {
        return <p className="text-xs leading-relaxed">{body}</p>;
      }
    }

    // Normal Text
    return <p className={`text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${isCS ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{body}</p>;
  };

  if (!session) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/40 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
          <Sparkles className="w-8 h-8 text-emerald-500/60 dark:text-emerald-400/60" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white text-base">Pilih Percakapan Pelanggan</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
          Pilih salah satu obrolan dari daftar sebelah kiri untuk membalas chat pelanggan lintas marketplace.
        </p>
      </div>
    );
  }

  const pConfig = getPlatformConfig(session.platform);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 transition-colors">
      {/* 1. Chat Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Customer Avatar & Names */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold flex items-center justify-center text-sm shadow-xs border border-slate-800 dark:border-slate-700">
              {session.customer_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{session.customer_name}</h3>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${pConfig.badgeBg}`}
                >
                  {pConfig.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hidden sm:inline-block">
                  {session.loyalty_tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{session.customer_phone}</p>
            </div>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
              session.status === 'open'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {session.status === 'open' ? 'Sesi Terbuka' : 'Selesai'}
          </span>

          {showProfileToggle && onToggleProfile && (
            <button
              onClick={onToggleProfile}
              className="lg:hidden text-xs font-semibold px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Profil
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages Bubble Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400 dark:text-slate-500">
            Memuat riwayat chat...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500">
            <p className="text-xs">Belum ada riwayat pesan dalam sesi ini.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCS = msg.sender === 'cs';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isCS ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 sm:p-3.5 shadow-2xs ${
                    isCS
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {renderMessageBody(msg.body, isCS)}
                </div>

                {/* Message Meta Info */}
                <div
                  className={`flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 px-1 font-medium ${
                    isCS ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{formatTimeOnly(msg.created_at)}</span>
                  {isCS && <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}

                  {/* First Response Latency Metric Badge */}
                  {msg.first_response_ms && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-md border border-amber-200 dark:border-amber-800 ml-1">
                      <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      <span>Respon awal: {Math.round(msg.first_response_ms / 1000)}s</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Actions Toolbar */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
          Aksi Cepat:
        </span>

        {/* Template Button */}
        <button
          type="button"
          onClick={() => setIsQuickRepliesOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs transition-all cursor-pointer"
        >
          <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Template Balasan</span>
        </button>

        {/* Catalog Button */}
        <button
          type="button"
          onClick={() => setIsCatalogOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs transition-all cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Bagikan Katalog</span>
        </button>

        {/* Shipping Rate Button */}
        <button
          type="button"
          onClick={() => setIsShippingOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs transition-all cursor-pointer"
        >
          <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Cek Ongkir</span>
        </button>
      </div>

      {/* 4. Chat Input Area */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Balas ${session.customer_name} via ${pConfig.name}... (Tekan Enter untuk kirim)`}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none px-2 py-1 leading-relaxed"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            title="Kirim pesan (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Modals */}
      <QuickRepliesModal
        isOpen={isQuickRepliesOpen}
        onClose={() => setIsQuickRepliesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <ProductCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSendProductCard={handleSendProductCard}
      />

      <ShippingCalculatorModal
        isOpen={isShippingOpen}
        onClose={() => setIsShippingOpen(false)}
        onSendShippingQuote={handleSendShippingQuote}
      />
    </div>
  );
};
