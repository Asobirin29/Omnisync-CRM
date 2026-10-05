export type Platform = 'shopee' | 'tokopedia' | 'lazada' | 'blibli' | 'whatsapp';

export type UserRole = 'cs' | 'manager';

export interface ChatSession {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  platform: Platform;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: 'open' | 'resolved';
  urgency: 'low' | 'medium' | 'high';
  customer_tags: string[];
}

export interface ChatMessage {
  id: number;
  session_id: number;
  sender: 'customer' | 'cs';
  body: string;
  created_at: string;
  first_response_ms?: number | null;
}

export interface InventoryChannel {
  id: number;
  platform: Platform;
  platform_item_id?: string;
  stock: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
}

export interface ProductVariant {
  id: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  total_stock: number;
  channels: InventoryChannel[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  created_at: string;
  variants: ProductVariant[];
}

export interface Customer {
  id: number;
  name: string;
  phone_number: string;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  purchase_history_count: number;
  lifetime_value: number;
  preferred_platform: Platform;
  created_at: string;
  tags: string[];
  orders?: any[];
}
