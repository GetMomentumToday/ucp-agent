'use client';

import { useCallback } from 'react';
import { useThreadRuntime } from '@assistant-ui/react';
import { ProductCards } from '@/app/components/ProductCard';
import { OrderCard } from '@/app/components/OrderCard';
import { CheckoutCard } from '@/app/components/CheckoutCard';
import { ToolIndicator } from '@/app/components/ToolIndicator';

interface Product {
  readonly id: string;
  readonly title: string;
  readonly price_cents: number;
  readonly currency: string;
  readonly in_stock: boolean;
  readonly images?: readonly string[];
  readonly description?: string | null;
}

interface TotalLine {
  readonly type: string;
  readonly amount: number;
  readonly display_text?: string;
}

interface Order {
  readonly id: string;
  readonly status: string;
  readonly total_cents: number;
  readonly currency: string;
}

interface CheckoutSession {
  readonly id: string;
  readonly status: string;
  readonly order?: Order;
  readonly totals?: readonly TotalLine[];
  readonly line_items?: readonly {
    readonly item: { readonly title?: string; readonly id?: string };
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

function isOrder(value: unknown): value is Order {
  return typeof value === 'object' && value !== null && 'total_cents' in value && 'status' in value;
}

interface ToolRenderProps {
  readonly args: Record<string, unknown>;
  readonly result: unknown;
  readonly status: { readonly type: string };
}

function ToolBlock({
  toolName,
  status,
  children,
}: {
  readonly toolName: string;
  readonly status: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tool-block">
      <ToolIndicator toolName={toolName} state={status === 'running' ? 'running' : 'result'} />
      {children}
    </div>
  );
}

function SearchProductsUI({ result, status }: ToolRenderProps) {
  if (!result || typeof result !== 'object') {
    return (
      <ToolBlock toolName="search_products" status={status.type}>
        <></>
      </ToolBlock>
    );
  }
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isProductArray(result)) {
    return (
      <ToolBlock toolName="search_products" status={status.type}>
        <ProductCards products={result} />
      </ToolBlock>
    );
  }
  return null;
}

function GetProductUI({ result, status }: ToolRenderProps) {
  if (!result || typeof result !== 'object') {
    return (
      <ToolBlock toolName="get_product" status={status.type}>
        <></>
      </ToolBlock>
    );
  }
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isProduct(result)) {
    return (
      <ToolBlock toolName="get_product" status={status.type}>
        <ProductCards products={[result]} />
      </ToolBlock>
    );
  }
  return null;
}

function CheckoutUI({ result, status, toolName }: ToolRenderProps & { toolName: string }) {
  if (!result || typeof result !== 'object') {
    return (
      <ToolBlock toolName={toolName} status={status.type}>
        <></>
      </ToolBlock>
    );
  }
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isCheckoutSession(result) && result.totals && result.totals.length > 0) {
    return (
      <ToolBlock toolName={toolName} status={status.type}>
        <CheckoutCard
          currency={result.currency ?? 'USD'}
          lineItems={result.line_items ?? []}
          totals={result.totals}
        />
      </ToolBlock>
    );
  }
  return null;
}

function hasShippingOrTax(session: CheckoutSession): boolean {
  if (!session.totals) return false;
  const types = session.totals.map((t) => t.type);
  return types.includes('shipping') || types.includes('tax');
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

  if (!result || typeof result !== 'object') {
    return (
      <ToolBlock toolName="update_checkout" status={status.type}>
        <></>
      </ToolBlock>
    );
  }
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isCheckoutSession(result) && result.totals && result.totals.length > 0) {
    const showActions = hasShippingOrTax(result);
    return (
      <ToolBlock toolName="update_checkout" status={status.type}>
        <CheckoutCard
          currency={result.currency ?? 'USD'}
          lineItems={result.line_items ?? []}
          totals={result.totals}
          onConfirm={showActions ? handleConfirm : undefined}
          onCancel={showActions ? handleCancel : undefined}
        />
      </ToolBlock>
    );
  }
  return null;
}

function CompleteCheckoutUI({ result, status }: ToolRenderProps) {
  if (!result || typeof result !== 'object') {
    return (
      <ToolBlock toolName="complete_checkout" status={status.type}>
        <></>
      </ToolBlock>
    );
  }
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isCheckoutSession(result) && result.order?.id) {
    return (
      <ToolBlock toolName="complete_checkout" status={status.type}>
        <OrderCard
          orderId={result.order.id}
          totalCents={result.order.total_cents}
          currency={result.order.currency ?? result.currency ?? 'USD'}
          status={result.order.status}
        />
      </ToolBlock>
    );
  }
  return null;
}

function GetOrderUI({ result, status }: ToolRenderProps) {
  if (!result || typeof result !== 'object') {
    return (
      <ToolBlock toolName="get_order" status={status.type}>
        <></>
      </ToolBlock>
    );
  }
  if ('error' in (result as Record<string, unknown>)) return null;
  if (isOrder(result)) {
    return (
      <ToolBlock toolName="get_order" status={status.type}>
        <OrderCard
          orderId={result.id}
          totalCents={result.total_cents}
          currency={result.currency}
          status={result.status}
        />
      </ToolBlock>
    );
  }
  return null;
}

export const UCP_TOOL_RENDER: Record<string, (props: ToolRenderProps) => React.ReactNode> = {
  search_products: SearchProductsUI,
  get_product: GetProductUI,
  create_checkout: (props) => <CheckoutUI {...props} toolName="create_checkout" />,
  get_checkout: (props) => <CheckoutUI {...props} toolName="get_checkout" />,
  update_checkout: UpdateCheckoutUI,
  complete_checkout: CompleteCheckoutUI,
  cancel_checkout: () => null,
  get_order: GetOrderUI,
  set_fulfillment: (props) => <CheckoutUI {...props} toolName="set_fulfillment" />,
  select_destination: (props) => <CheckoutUI {...props} toolName="select_destination" />,
  select_fulfillment_option: (props) => (
    <CheckoutUI {...props} toolName="select_fulfillment_option" />
  ),
  apply_discount_codes: (props) => <CheckoutUI {...props} toolName="apply_discount_codes" />,
};
