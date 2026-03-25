import { tool } from 'ai';
import { z } from 'zod';
import { UCPClient, UCPError, UCPEscalationError } from '@momentum/ucp-client';
import {
  getCheckoutSessionId,
  setCheckoutSessionId,
  clearCheckoutSessionId,
} from './session-store.js';

function createClient(): UCPClient {
  const gatewayUrl = process.env['GATEWAY_URL'];
  const agentProfileUrl = process.env['UCP_AGENT_PROFILE'];

  if (!gatewayUrl || !agentProfileUrl) {
    throw new Error('GATEWAY_URL and UCP_AGENT_PROFILE env vars are required');
  }

  return new UCPClient({ gatewayUrl, agentProfileUrl });
}

function formatError(error: unknown): string {
  if (error instanceof UCPEscalationError) {
    return `Payment requires browser redirect: ${error.continue_url}`;
  }
  if (error instanceof UCPError) {
    return `UCP error [${error.code}]: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function createUcpTools(sessionId: string) {
  const client = createClient();

  return {
    ucp_discover: tool({
      description:
        'Discover the store capabilities, supported payment handlers, and API version. Call this first before any checkout operations.',
      parameters: z.object({}),
      execute: async () => {
        try {
          return await client.discover();
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),

    ucp_search_products: tool({
      description: 'Search for products by keyword. Returns matching products with prices and stock.',
      parameters: z.object({
        query: z.string().describe('Search keyword (e.g., "shoes", "sneakers")'),
        max_price_cents: z.number().int().optional().describe('Maximum price in cents'),
        min_price_cents: z.number().int().optional().describe('Minimum price in cents'),
        in_stock: z.boolean().optional().describe('Filter to only in-stock items'),
        category: z.string().optional().describe('Product category filter'),
        limit: z.number().int().optional().describe('Max results to return'),
      }),
      execute: async ({ query, ...filters }) => {
        try {
          return await client.searchProducts(query, filters);
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),

    ucp_get_product: tool({
      description: 'Get detailed product information by ID, including variants and stock.',
      parameters: z.object({
        product_id: z.string().describe('The product ID'),
      }),
      execute: async ({ product_id }) => {
        try {
          return await client.getProduct(product_id);
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),

    ucp_create_checkout: tool({
      description:
        'Create a new checkout session (cart) with line items. Returns the checkout session with totals.',
      parameters: z.object({
        line_items: z
          .array(
            z.object({
              item: z.object({ id: z.string().describe('Product ID') }),
              quantity: z.number().int().min(1).describe('Quantity'),
            }),
          )
          .min(1)
          .describe('Items to add to cart'),
        currency: z.string().length(3).optional().describe('Currency code (e.g., "USD")'),
        buyer: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            email: z.string().email().optional(),
            phone_number: z.string().optional(),
          })
          .optional()
          .describe('Buyer information'),
      }),
      execute: async (payload) => {
        try {
          const session = await client.createCheckout(payload);
          setCheckoutSessionId(sessionId, session.id);
          return session;
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),

    ucp_update_checkout: tool({
      description:
        'Update an existing checkout session — set buyer info, shipping address, or fulfillment method.',
      parameters: z.object({
        checkout_id: z
          .string()
          .optional()
          .describe('Checkout session ID (uses current session if omitted)'),
        buyer: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            email: z.string().email().optional(),
            phone_number: z.string().optional(),
          })
          .optional()
          .describe('Updated buyer info'),
        fulfillment: z
          .object({
            destinations: z
              .array(
                z.object({
                  id: z.string(),
                  address: z.object({
                    street_address: z.string().optional(),
                    address_locality: z.string().optional(),
                    address_region: z.string().optional(),
                    postal_code: z.string().optional(),
                    address_country: z.string().optional(),
                  }),
                }),
              )
              .optional(),
            methods: z
              .array(
                z.object({
                  id: z.string(),
                  type: z.string(),
                  selected_destination_id: z.string().optional(),
                  groups: z
                    .array(
                      z.object({
                        id: z.string(),
                        selected_option_id: z.string().optional(),
                      }),
                    )
                    .optional(),
                }),
              )
              .optional(),
          })
          .optional()
          .describe('Fulfillment configuration — shipping address and method'),
        discounts: z
          .object({
            codes: z.array(z.string()).optional(),
          })
          .optional()
          .describe('Discount codes to apply'),
      }),
      execute: async ({ checkout_id, ...patch }) => {
        try {
          const id = checkout_id ?? getCheckoutSessionId(sessionId);
          if (!id) {
            return { error: 'No active checkout session. Create one first with ucp_create_checkout.' };
          }
          const session = await client.updateCheckout(id, patch);
          return session;
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),

    ucp_complete_checkout: tool({
      description:
        'Complete a checkout session by submitting payment. Use a payment handler ID from ucp_discover.',
      parameters: z.object({
        checkout_id: z
          .string()
          .optional()
          .describe('Checkout session ID (uses current session if omitted)'),
        payment: z.object({
          instruments: z
            .array(
              z.object({
                id: z.string().describe('Instrument ID (can be "default")'),
                handler_id: z.string().describe('Payment handler ID from discover'),
                type: z.string().describe('Payment type (e.g., "check_money_order")'),
                selected: z.boolean().optional().default(true),
              }),
            )
            .min(1),
        }),
      }),
      execute: async ({ checkout_id, payment }) => {
        try {
          const id = checkout_id ?? getCheckoutSessionId(sessionId);
          if (!id) {
            return { error: 'No active checkout session. Create one first with ucp_create_checkout.' };
          }
          const session = await client.completeCheckout(id, { payment });
          clearCheckoutSessionId(sessionId);
          return session;
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),

    ucp_cancel_checkout: tool({
      description: 'Cancel an active checkout session.',
      parameters: z.object({
        checkout_id: z
          .string()
          .optional()
          .describe('Checkout session ID (uses current session if omitted)'),
      }),
      execute: async ({ checkout_id }) => {
        try {
          const id = checkout_id ?? getCheckoutSessionId(sessionId);
          if (!id) {
            return { error: 'No active checkout session to cancel.' };
          }
          const session = await client.cancelCheckout(id);
          clearCheckoutSessionId(sessionId);
          return session;
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),

    ucp_get_order: tool({
      description: 'Get order status and details by order ID.',
      parameters: z.object({
        order_id: z.string().describe('The order ID returned after completing checkout'),
      }),
      execute: async ({ order_id }) => {
        try {
          return await client.getOrder(order_id);
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    }),
  };
}
