'use client';

import { useCallback } from 'react';
import { useThreadRuntime } from '@assistant-ui/react';
import { ProductCards } from '@/app/components/ProductCard';
import { OrderCard } from '@/app/components/OrderCard';
import { TotalsBox } from '@/app/components/TotalsBox';
import { ToolIndicator } from '@/app/components/ToolIndicator';

interface Product {
  readonly id: string;
  readonly title: string;
  readonly price_cents: number;
  readonly currency: string;
  readonly in_stock: boolean;
  readonly images?: readonly string[];
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
      lines.push({ label: `${title} x${li.quantity}`, amount: '' });
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

interface ToolRenderProps {
  readonly args: Record<string, unknown>;
  readonly result: unknown;
  readonly status: { readonly type: string };
}

function LoadingIndicator({ toolName }: { readonly toolName: string }) {
  return <ToolIndicator toolName={toolName} state="running" />;
}

function SearchProductsUI({ result, status }: ToolRenderProps) {
  if (status.type === 'running') return <LoadingIndicator toolName="ucp_search_products" />;
  if (!result || typeof result !== 'object') return null;
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isProductArray(result)) return <ProductCards products={result} />;
  return null;
}

function GetProductUI({ result, status }: ToolRenderProps) {
  if (status.type === 'running') return <LoadingIndicator toolName="ucp_get_product" />;
  if (!result || typeof result !== 'object') return null;
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isProduct(result)) return <ProductCards products={[result]} />;
  return null;
}

function CreateCheckoutUI({ result, status }: ToolRenderProps) {
  if (status.type === 'running') return <LoadingIndicator toolName="ucp_create_checkout" />;
  if (!result || typeof result !== 'object') return null;
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isCheckoutSession(result) && result.totals && result.totals.length > 0) {
    const { lines, total } = buildTotalsFromCheckout(result);
    return <TotalsBox lines={lines} total={total} />;
  }
  return null;
}

function hasShippingAndTax(session: CheckoutSession): boolean {
  if (!session.totals) return false;
  const types = session.totals.map((t) => t.type);
  return types.includes('shipping') && types.includes('tax');
}

function useSendMessage(text: string) {
  const runtime = useThreadRuntime();
  return useCallback(() => {
    runtime.append({ role: 'user', content: [{ type: 'text', text }] });
  }, [runtime, text]);
}

function UpdateCheckoutUI({ result, status }: ToolRenderProps) {
  const handleConfirm = useSendMessage('Yes, place the order');
  const handleCancel = useSendMessage('Cancel the order');

  if (status.type === 'running') return <LoadingIndicator toolName="ucp_update_checkout" />;
  if (!result || typeof result !== 'object') return null;
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isCheckoutSession(result) && result.totals && result.totals.length > 0) {
    const { lines, total } = buildTotalsFromCheckout(result);
    const showActions = hasShippingAndTax(result);
    return (
      <TotalsBox
        lines={lines}
        total={total}
        onConfirm={showActions ? handleConfirm : undefined}
        onCancel={showActions ? handleCancel : undefined}
      />
    );
  }
  return null;
}

function CompleteCheckoutUI({ result, status }: ToolRenderProps) {
  if (status.type === 'running') return <LoadingIndicator toolName="ucp_complete_checkout" />;
  if (!result || typeof result !== 'object') return null;
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isCheckoutSession(result) && result.order_id) {
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
  return null;
}

function GetOrderUI({ result, status }: ToolRenderProps) {
  if (status.type === 'running') return <LoadingIndicator toolName="ucp_get_order" />;
  if (!result || typeof result !== 'object') return null;
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isOrder(result)) {
    return (
      <OrderCard
        orderId={result.id}
        totalCents={result.total_cents}
        currency={result.currency}
        status={result.status}
      />
    );
  }
  return null;
}

export const UCP_TOOL_RENDER: Record<string, (props: ToolRenderProps) => React.ReactNode> = {
  ucp_discover: () => null,
  ucp_search_products: SearchProductsUI,
  ucp_get_product: GetProductUI,
  ucp_create_checkout: CreateCheckoutUI,
  ucp_update_checkout: UpdateCheckoutUI,
  ucp_complete_checkout: CompleteCheckoutUI,
  ucp_cancel_checkout: () => null,
  ucp_get_order: GetOrderUI,
};
