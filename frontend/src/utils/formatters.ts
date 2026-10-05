import type { Platform } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Baru saja';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} mnt lalu`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam lalu`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Kemarin';
  }
  if (diffInDays < 7) {
    return `${diffInDays} hari lalu`;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTimeOnly(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export interface PlatformConfig {
  name: string;
  bgLight: string;
  textDark: string;
  badgeBg: string;
  dotBg: string;
  border: string;
}

export function getPlatformConfig(platform: Platform): PlatformConfig {
  switch (platform) {
    case 'whatsapp':
      return {
        name: 'WhatsApp',
        bgLight: 'bg-emerald-50',
        textDark: 'text-emerald-700',
        badgeBg: 'bg-[#25D366] text-white',
        dotBg: 'bg-[#25D366]',
        border: 'border-emerald-200'
      };
    case 'shopee':
      return {
        name: 'Shopee',
        bgLight: 'bg-orange-50',
        textDark: 'text-orange-700',
        badgeBg: 'bg-[#ee4d2d] text-white',
        dotBg: 'bg-[#ee4d2d]',
        border: 'border-orange-200'
      };
    case 'tokopedia':
      return {
        name: 'Tokopedia',
        bgLight: 'bg-green-50',
        textDark: 'text-green-800',
        badgeBg: 'bg-[#03ac0e] text-white',
        dotBg: 'bg-[#03ac0e]',
        border: 'border-green-300'
      };
    case 'lazada':
      return {
        name: 'Lazada',
        bgLight: 'bg-blue-50',
        textDark: 'text-blue-800',
        badgeBg: 'bg-[#1050e6] text-white',
        dotBg: 'bg-[#1050e6]',
        border: 'border-blue-200'
      };
    case 'blibli':
      return {
        name: 'Blibli',
        bgLight: 'bg-sky-50',
        textDark: 'text-sky-900',
        badgeBg: 'bg-[#0095dc] text-white',
        dotBg: 'bg-[#0095dc]',
        border: 'border-sky-300'
      };
    default:
      return {
        name: platform,
        bgLight: 'bg-slate-100',
        textDark: 'text-slate-800',
        badgeBg: 'bg-slate-600 text-white',
        dotBg: 'bg-slate-600',
        border: 'border-slate-300'
      };
  }
}
