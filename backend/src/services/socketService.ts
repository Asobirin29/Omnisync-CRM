import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join_chat', (chatId: string | number) => {
      socket.join(`chat_${chatId}`);
      console.log(`[Socket.io] Client ${socket.id} joined room chat_${chatId}`);
    });

    socket.on('leave_chat', (chatId: string | number) => {
      socket.leave(`chat_${chatId}`);
      console.log(`[Socket.io] Client ${socket.id} left room chat_${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitStockUpdated(payload: {
  variant_id: number;
  sku: string;
  product_name?: string;
  channels: {
    platform: string;
    stock: number;
    low_stock_threshold: number;
    is_low_stock: boolean;
  }[];
  total_stock: number;
}): void {
  if (!io) return;
  console.log(`[Socket.io] Emitting stock:updated for SKU ${payload.sku}`);
  io.emit('stock:updated', payload);
}

export function emitOrderCreated(payload: any): void {
  if (!io) return;
  console.log(`[Socket.io] Emitting order:created for Order ${payload.external_order_id || payload.id}`);
  io.emit('order:created', payload);
}

export function emitOrderUpdated(payload: any): void {
  if (!io) return;
  console.log(`[Socket.io] Emitting order:updated for Order ID ${payload.id}`);
  io.emit('order:updated', payload);
}

export function emitCustomerUpdated(payload: {
  customer_id: number;
  tags: string[];
  lifetime_value: number;
  purchase_history_count: number;
  loyalty_tier: string;
}): void {
  if (!io) return;
  console.log(`[Socket.io] Emitting customer:updated for Customer ID ${payload.customer_id}`);
  io.emit('customer:updated', payload);
}

export function emitMessageNew(payload: any): void {
  if (!io) return;
  console.log(`[Socket.io] Emitting message:new for Session ${payload.session_id}`);
  io.emit('message:new', payload);
  if (payload.session_id) {
    io.to(`chat_${payload.session_id}`).emit('room:message:new', payload);
  }
}

export function emitChatUpdated(payload: any): void {
  if (!io) return;
  console.log(`[Socket.io] Emitting chat:updated for Session ${payload.id}`);
  io.emit('chat:updated', payload);
}
