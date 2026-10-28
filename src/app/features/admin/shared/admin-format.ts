export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string; icon: string }> = {
  pending: { label: 'En attente', tone: 'amber', icon: 'fa-hourglass-half' },
  paid: { label: 'Payée', tone: 'violet', icon: 'fa-credit-card' },
  processing: { label: 'En traitement', tone: 'orange', icon: 'fa-gear' },
  shipped: { label: 'Expédiée', tone: 'blue', icon: 'fa-truck-fast' },
  delivered: { label: 'Livrée', tone: 'green', icon: 'fa-circle-check' },
  cancelled: { label: 'Annulée', tone: 'red', icon: 'fa-ban' },
};

export const ORDER_STATUS_LIST = Object.entries(ORDER_STATUS).map(([value, s]) => ({
  value: value as OrderStatus,
  ...s,
}));

export const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: 'Paiement à la livraison',
  cod: 'Paiement à la livraison',
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  mtn_momo: 'MTN Mobile Money',
  moov_money: 'Moov Money',
  moov: 'Moov Money',
  wave: 'Wave',
  card: 'Carte bancaire',
};

export function statusLabel(status: string | null | undefined): string {
  return ORDER_STATUS[status as OrderStatus]?.label ?? status ?? '—';
}

export function statusTone(status: string | null | undefined): string {
  return ORDER_STATUS[status as OrderStatus]?.tone ?? 'grey';
}

export function paymentLabel(method: string | null | undefined): string {
  if (!method) return '—';
  return PAYMENT_LABELS[method] ?? method.replace(/_/g, ' ');
}

const DELIVERY_LABELS: Record<string, string> = {
  abidjan: 'Livraison à Abidjan',
  interior: "Livraison à l'intérieur du pays",
};

export function deliveryLabel(method: string | null | undefined): string {
  if (!method) return '—';
  return DELIVERY_LABELS[method] ?? method.replace(/_/g, ' ');
}

const priceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value) || 0;
  return `${priceFormatter.format(Math.round(n)).replace(/\u202f|\u00a0/g, ' ')} F CFA`;
}

export function formatNumber(value: number | string | null | undefined): string {
  return priceFormatter.format(Math.round(Number(value) || 0)).replace(/\u202f|\u00a0/g, ' ');
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',').replace(',0', '')}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateFormatter.format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${dateFormatter.format(d)} • ${timeFormatter.format(d)}`;
}

export function initials(name: string | null | undefined): string {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const escape = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '\ufeff' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
