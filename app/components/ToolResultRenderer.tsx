import { ProductCards } from './ProductCard';
import { OrderCard } from './OrderCard';

interface ToolResultRendererProps {
  readonly toolName: string;
  readonly result: unknown;
}

function isProductArray(value: unknown): value is readonly { id: string; title: string; price_cents: number; currency: string; in_stock: boolean }[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'price_cents' in value[0];
}

function isOrder(value: unknown): value is { id: string; total_cents: number; currency: string; status: string } {
  return typeof value === 'object' && value !== null && 'total_cents' in value && 'status' in value;
}

function isCheckoutWithOrder(value: unknown): value is { order_id?: string; status: string } {
  return typeof value === 'object' && value !== null && 'status' in value;
}

export function ToolResultRenderer({ toolName, result }: ToolResultRendererProps) {
  if (!result || typeof result !== 'object') return null;

  if ('error' in (result as Record<string, unknown>)) {
    return null;
  }

  if (toolName === 'ucp_search_products' && isProductArray(result)) {
    return <ProductCards products={result} />;
  }

  if (toolName === 'ucp_get_product' && typeof result === 'object' && result !== null && 'price_cents' in result) {
    const p = result as { id: string; title: string; price_cents: number; currency: string; in_stock: boolean };
    return <ProductCards products={[p]} />;
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

  if (toolName === 'ucp_complete_checkout' && isCheckoutWithOrder(result) && result.order_id) {
    return (
      <OrderCard
        orderId={result.order_id}
        totalCents={'total_cents' in (result as Record<string, unknown>) ? (result as Record<string, unknown>)['total_cents'] as number : 0}
        currency={'currency' in (result as Record<string, unknown>) ? (result as Record<string, unknown>)['currency'] as string : 'USD'}
        status={result.status}
      />
    );
  }

  return null;
}
