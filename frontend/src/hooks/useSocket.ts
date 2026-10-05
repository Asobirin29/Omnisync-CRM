import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, ChatMessage } from '../types';
import { getSocket } from '../services/socket';

interface UseSocketOptions {
  selectedSessionId: number | null;
  loadChats: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

export function useSocket({
  selectedSessionId,
  loadChats,
  loadAnalytics,
  setMessages,
  setSessions,
}: UseSocketOptions) {
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    setIsSocketConnected(socket.connected);

    // Event 1: New Message received
    const handleMessageNew = (newMsg: any) => {
      console.log('⚡ [Realtime] message:new received:', newMsg);

      // Append to active chat if open
      if (newMsg.session_id === selectedSessionId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Update sessions list (move to top, update preview, increment unread if not open)
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === newMsg.session_id);
        if (index === -1) {
          loadChats();
          return prev;
        }

        const target = { ...prev[index] };
        target.last_message = newMsg.body;
        target.last_message_at = newMsg.created_at || new Date().toISOString();

        if (newMsg.sender === 'customer' && target.id !== selectedSessionId) {
          target.unread_count = (target.unread_count || 0) + 1;
        } else if (target.id === selectedSessionId) {
          target.unread_count = 0;
        }

        const rest = prev.filter((s) => s.id !== newMsg.session_id);
        return [target, ...rest];
      });

      // Refresh dashboard analytics in real-time
      loadAnalytics();
    };

    // Event 2: Chat session updated
    const handleChatUpdated = (updatedSession: any) => {
      console.log('⚡ [Realtime] chat:updated received:', updatedSession);
      setSessions((prev) => {
        const exists = prev.some((s) => s.id === updatedSession.id);
        if (!exists) {
          return [updatedSession, ...prev];
        }
        return prev.map((s) => (s.id === updatedSession.id ? { ...s, ...updatedSession } : s));
      });
      loadAnalytics();
    };

    // Event 3: Customer updated (tags, LTV, tier)
    const handleCustomerUpdated = (payload: any) => {
      console.log('⚡ [Realtime] customer:updated received:', payload);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.customer_id === payload.customer_id) {
            return {
              ...s,
              customer_tags: payload.tags,
              loyalty_tier: payload.loyalty_tier,
            };
          }
          return s;
        })
      );
    };

    // Event 4: Order Created (Webhook or Manual) -> Real-time update for Dashboard & stock!
    const handleOrderCreated = (order: any) => {
      console.log('⚡ [Realtime] order:created received:', order);
      loadAnalytics();
    };

    // Event 5: Stock Updated -> Real-time update for Dashboard stock table & alerts!
    const handleStockUpdated = (stockPayload: any) => {
      console.log('⚡ [Realtime] stock:updated received:', stockPayload);
      loadAnalytics();
    };

    // Event 6: Order Status Updated
    const handleOrderUpdated = (order: any) => {
      console.log('⚡ [Realtime] order:updated received:', order);
      loadAnalytics();
    };

    // Event 7: Demo Reset by any client
    const handleDemoReset = () => {
      console.log('⚡ [Realtime] demo:reset received: Reloading all data');
      loadChats();
      loadAnalytics();
    };

    socket.on('message:new', handleMessageNew);
    socket.on('chat:updated', handleChatUpdated);
    socket.on('customer:updated', handleCustomerUpdated);
    socket.on('order:created', handleOrderCreated);
    socket.on('stock:updated', handleStockUpdated);
    socket.on('order:updated', handleOrderUpdated);
    socket.on('demo:reset', handleDemoReset);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new', handleMessageNew);
      socket.off('chat:updated', handleChatUpdated);
      socket.off('customer:updated', handleCustomerUpdated);
      socket.off('order:created', handleOrderCreated);
      socket.off('stock:updated', handleStockUpdated);
      socket.off('order:updated', handleOrderUpdated);
      socket.off('demo:reset', handleDemoReset);
    };
  }, [selectedSessionId, loadChats, loadAnalytics]);

  return { isSocketConnected };
}
