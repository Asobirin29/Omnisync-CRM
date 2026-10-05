import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { emitMessageNew, emitChatUpdated } from '../services/socketService.js';

export const getChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, status, urgency, search } = req.query;

    let query = `
      SELECT 
        cs.id,
        cs.customer_id,
        c.name AS customer_name,
        c.phone_number AS customer_phone,
        c.loyalty_tier,
        cs.platform,
        cs.last_message,
        cs.last_message_at,
        cs.unread_count,
        cs.status,
        cs.urgency,
        COALESCE(
          (
            SELECT json_agg(ct.tag) 
            FROM customer_tags ct 
            WHERE ct.customer_id = c.id
          ),
          '[]'::json
        ) AS customer_tags
      FROM chat_sessions cs
      JOIN customers c ON cs.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (platform) {
      params.push(platform);
      query += ` AND cs.platform = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND cs.status = $${params.length}`;
    }

    if (urgency) {
      params.push(urgency);
      query += ` AND cs.urgency = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR cs.last_message ILIKE $${params.length} OR c.phone_number ILIKE $${params.length})`;
    }

    query += ` ORDER BY cs.last_message_at DESC`;

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      total: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil sesi chat' });
  }
};

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if session exists
    const sessionRes = await db.query(
      `SELECT 
        cs.id,
        cs.customer_id,
        c.name AS customer_name,
        c.phone_number AS customer_phone,
        c.loyalty_tier,
        c.preferred_platform,
        cs.platform,
        cs.status,
        cs.urgency,
        cs.unread_count,
        cs.last_message_at,
        COALESCE(
          (
            SELECT json_agg(ct.tag) 
            FROM customer_tags ct 
            WHERE ct.customer_id = c.id
          ),
          '[]'::json
        ) AS customer_tags
      FROM chat_sessions cs
      JOIN customers c ON cs.customer_id = c.id
      WHERE cs.id = $1`,
      [id]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Sesi chat tidak ditemukan' });
      return;
    }

    const session = sessionRes.rows[0];

    // Get messages
    const messagesRes = await db.query(
      `SELECT 
        id,
        session_id,
        sender,
        body,
        created_at,
        first_response_ms
      FROM chat_messages
      WHERE session_id = $1
      ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      status: 'success',
      data: {
        session,
        messages: messagesRes.rows
      }
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil pesan chat' });
  }
};

export const sendCSMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body || typeof body !== 'string' || body.trim() === '') {
      res.status(400).json({ status: 'error', message: 'Isi pesan (body) wajib diisi' });
      return;
    }

    // 1. Check session existence
    const sessionRes = await db.query(
      `SELECT cs.*, c.name AS customer_name, c.phone_number AS customer_phone
       FROM chat_sessions cs
       JOIN customers c ON cs.customer_id = c.id
       WHERE cs.id = $1`,
      [id]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Sesi chat tidak ditemukan' });
      return;
    }

    const session = sessionRes.rows[0];

    // 2. Check if this is the first CS reply in this session to compute first_response_ms
    let firstResponseMs: number | null = null;
    const csCountRes = await db.query(
      `SELECT COUNT(*) as count FROM chat_messages WHERE session_id = $1 AND sender = 'cs'`,
      [id]
    );

    const isFirstCsReply = Number(csCountRes.rows[0].count) === 0;

    if (isFirstCsReply) {
      // Find the earliest customer message
      const firstCustMsgRes = await db.query(
        `SELECT created_at FROM chat_messages WHERE session_id = $1 AND sender = 'customer' ORDER BY created_at ASC LIMIT 1`,
        [id]
      );

      if (firstCustMsgRes.rows.length > 0) {
        const customerTime = new Date(firstCustMsgRes.rows[0].created_at).getTime();
        const nowTime = Date.now();
        firstResponseMs = Math.max(0, nowTime - customerTime);
      }
    }

    // 3. Save CS message
    const msgRes = await db.query(
      `INSERT INTO chat_messages (session_id, sender, body, created_at, first_response_ms)
       VALUES ($1, 'cs', $2, NOW(), $3) RETURNING *`,
      [id, body.trim(), firstResponseMs]
    );
    const savedMessage = msgRes.rows[0];

    // 4. Update session (reset unread_count to 0, update last_message)
    const updateSessionRes = await db.query(
      `UPDATE chat_sessions
       SET last_message = $1,
           last_message_at = NOW(),
           unread_count = 0
       WHERE id = $2
       RETURNING *`,
      [body.trim(), id]
    );

    const updatedSession = {
      ...updateSessionRes.rows[0],
      customer_name: session.customer_name,
      customer_phone: session.customer_phone
    };

    // 5. Emit real-time Socket.io events
    emitMessageNew({
      ...savedMessage,
      platform: session.platform
    });

    emitChatUpdated(updatedSession);

    res.status(201).json({
      status: 'success',
      message: 'Pesan CS berhasil dikirim',
      data: {
        message: savedMessage,
        session: updatedSession
      }
    });
  } catch (error: any) {
    console.error('Error sending CS message:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Gagal mengirim pesan balasan CS' });
  }
};
