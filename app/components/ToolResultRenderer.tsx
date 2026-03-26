import { ProductCards } from './ProductCard';
import { OrderCard } from './OrderCard';
import { TotalsBox } from './TotalsBox';

interface ToolResultRendererProps {
  readonly toolName: string;
  readonly result: unknown;
}

interface Product {
  readonly id: string;
  readonly title: string;
  readonly price_cents: number;
  readonly currency: string;
  readonly in_stock: boolean;
}

interface TotalLine {
  readonly type: string;
  readonly amount: number;
  readonly display_text?: string;
}

interface CheckoutSession {
  readonly id: string;
  readonly status: string;
  readonly order_id?: string;
  readonly totals?: readonly TotalLine[];
  readonly line_items?: readonly {
    readonly item: { readonly title?: string };
    readonly quantity: number;
  }[];
  readonly currency?: string;
}

function isProductArray(value: unknown): value is readonly Product[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null &&
    'price_cents' in value[0]
  );
}

function isProduct(value: unknown): value is Product {
  return typeof value === 'object' && value !== null && 'price_cents' in value && 'title' in value;
}

function isCheckoutSession(value: unknown): value is CheckoutSession {
  return typeof value === 'object' && value !== null && 'id' in value && 'status' in value;
}

function isOrder(
  value: unknown,
): value is { id: string; total_cents: number; currency: string; status: string } {
  return typeof value === 'object' && value !== null && 'total_cents' in value && 'status' in value;
}

function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function buildTotalsFromCheckout(session: CheckoutSession) {
  const lines: { label: string; amount: string }[] = [];
  const currency = session.currency ?? 'USD';

  if (session.line_items) {
    for (const li of session.line_items) {
      const title = li.item.title ?? 'Item';
      lines.push({ label: `${title} ×${li.quantity}`, amount: '' });
    }
  }

  let totalLine = { label: 'Total', amount: '$0.00' };

  if (session.totals) {
    for (const t of session.totals) {
      const label = t.display_text ?? t.type.charAt(0).toUpperCase() + t.type.slice(1);
      const amount = formatCents(t.amount, currency);
      if (t.type === 'total') {
        totalLine = { label, amount };
      } else {
        lines.push({ label, amount });
      }
    }
  }

  return { lines, total: totalLine };
}

export function ToolResultRenderer({ toolName, result }: ToolResultRendererProps) {
  if (!result || typeof result !== 'object') return null;
  if ('error' in (result as Record<string, unknown>)) return null;

  if (toolName === 'ucp_search_products' && isProductArray(result)) {
    return <ProductCards products={result} />;
  }

  if (toolName === 'ucp_get_product' && isProduct(result)) {
    return <ProductCards products={[result]} />;
  }

  if (toolName === 'ucp_get_order' && isOrder(result)) {
    return (
      <OrderCard
        orderId={result.id}
        totalCents={result.total_cents}
        currency={result.currency}
        status={result.status}
      />
    );
  }

  if (toolName === 'ucp_complete_checkout' && isCheckoutSession(result)) {
    if (result.order_id) {
      const totalEntry = result.totals?.find((t) => t.type === 'total');
      return (
        <OrderCard
          orderId={result.order_id}
          totalCents={totalEntry?.amount ?? 0}
          currency={result.currency ?? 'USD'}
          status={result.status}
        />
      );
    }
  }

  if (
    (toolName === 'ucp_create_checkout' || toolName === 'ucp_update_checkout') &&
    isCheckoutSession(result) &&
    result.totals &&
    result.totals.length > 0
  ) {
    const { lines, total } = buildTotalsFromCheckout(result);
    return <TotalsBox lines={lines} total={total} />;
  }

  return null;
}
