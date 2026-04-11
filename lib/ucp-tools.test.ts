import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AgentTool } from '@omnixhq/ucp-client';
import { withCheckoutTracking, withCartTracking } from './ucp-tools';
import {
  setCheckoutSessionId,
  getCheckoutSessionId,
  clearCheckoutSessionId,
  setCartSessionId,
  getCartSessionId,
  clearCartSessionId,
} from './session-store';

const mockCheckoutGet = vi.fn(async (id: string) => ({ id, status: 'incomplete' }));
const mockCartGet = vi.fn(async (id: string) => ({ id, status: 'active' }));

vi.mock('@omnixhq/ucp-client', () => ({
  UCPClient: {
    connect: vi.fn(async () => ({
      checkout: { get: mockCheckoutGet },
      cart: { get: mockCartGet },
      getAgentTools: () => [],
    })),
  },
}));

vi.mock('@omnixhq/ucp-client/vercel-ai', () => ({
  toVercelAITools: vi.fn((tools: AgentTool[]) => tools),
}));

function makeTool(name: string, executeFn?: AgentTool['execute']): AgentTool {
  return {
    name,
    description: `mock ${name}`,
    parameters: { type: 'object' },
    execute: executeFn ?? vi.fn(async (params) => ({ id: 'new-id', ...params })),
  };
}

const SESSION = 'test-session';

beforeEach(() => {
  vi.stubEnv('GATEWAY_URL', 'http://localhost:3000');
  vi.stubEnv('UCP_AGENT_PROFILE', 'http://localhost:3001/agent-profile.json');
  clearCheckoutSessionId(SESSION);
  clearCartSessionId(SESSION);
  mockCheckoutGet.mockClear();
  mockCartGet.mockClear();
});

describe('withCheckoutTracking', () => {
  describe('create_checkout', () => {
    it('saves checkout ID from result', async () => {
      const tool = makeTool('create_checkout');
      const tracked = withCheckoutTracking(tool, SESSION);

      await tracked.execute({ line_items: [] });

      expect(getCheckoutSessionId(SESSION)).toBe('new-id');
    });

    it('returns existing checkout if one exists', async () => {
      setCheckoutSessionId(SESSION, 'existing-checkout');

      const executeFn = vi.fn();
      const tool = makeTool('create_checkout', executeFn);
      const tracked = withCheckoutTracking(tool, SESSION);

      const result = (await tracked.execute({ line_items: [] })) as Record<string, unknown>;
      expect(result['_note']).toContain('Checkout already exists');
      expect(executeFn).not.toHaveBeenCalled();
      expect(mockCheckoutGet).toHaveBeenCalledWith('existing-checkout');
    });
  });

  describe('complete_checkout', () => {
    it('injects stored session ID when none provided', async () => {
      setCheckoutSessionId(SESSION, 'checkout-123');
      const executeFn = vi.fn(async () => ({ status: 'completed' }));
      const tool = makeTool('complete_checkout', executeFn);
      const tracked = withCheckoutTracking(tool, SESSION);

      await tracked.execute({ payment: {} });

      expect(executeFn).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'checkout-123', payment: {} }),
      );
    });

    it('clears session after completion', async () => {
      setCheckoutSessionId(SESSION, 'checkout-123');
      const tool = makeTool('complete_checkout', vi.fn(async () => ({ status: 'completed' })));
      const tracked = withCheckoutTracking(tool, SESSION);

      await tracked.execute({ payment: {} });

      expect(getCheckoutSessionId(SESSION)).toBeUndefined();
    });

    it('returns error when no checkout exists', async () => {
      const tool = makeTool('complete_checkout');
      const tracked = withCheckoutTracking(tool, SESSION);

      const result = (await tracked.execute({})) as Record<string, string>;
      expect(result['error']).toContain('No active checkout session');
    });

    it('uses explicit ID over stored session', async () => {
      setCheckoutSessionId(SESSION, 'stored-id');
      const executeFn = vi.fn(async () => ({ status: 'completed' }));
      const tool = makeTool('complete_checkout', executeFn);
      const tracked = withCheckoutTracking(tool, SESSION);

      await tracked.execute({ id: 'explicit-id', payment: {} });

      expect(executeFn).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'explicit-id' }),
      );
    });
  });

  describe('cancel_checkout', () => {
    it('clears session after cancellation', async () => {
      setCheckoutSessionId(SESSION, 'checkout-123');
      const tool = makeTool('cancel_checkout', vi.fn(async () => ({ status: 'cancelled' })));
      const tracked = withCheckoutTracking(tool, SESSION);

      await tracked.execute({});

      expect(getCheckoutSessionId(SESSION)).toBeUndefined();
    });
  });

  describe('checkout read tools', () => {
    const toolNames = [
      'update_checkout',
      'get_checkout',
      'set_fulfillment',
      'select_destination',
      'select_fulfillment_option',
      'apply_discount_codes',
    ];

    for (const toolName of toolNames) {
      it(`${toolName}: injects stored session ID`, async () => {
        setCheckoutSessionId(SESSION, 'checkout-123');
        const executeFn = vi.fn(async () => ({}));
        const tool = makeTool(toolName, executeFn);
        const tracked = withCheckoutTracking(tool, SESSION);

        await tracked.execute({ some: 'param' });

        expect(executeFn).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'checkout-123', some: 'param' }),
        );
      });

      it(`${toolName}: returns error when no session`, async () => {
        const tool = makeTool(toolName);
        const tracked = withCheckoutTracking(tool, SESSION);

        const result = (await tracked.execute({})) as Record<string, string>;
        expect(result['error']).toContain('No active checkout session');
      });
    }
  });

  describe('untracked tools', () => {
    it('returns tool unchanged for unknown names', () => {
      const tool = makeTool('search_catalog');
      const tracked = withCheckoutTracking(tool, SESSION);
      expect(tracked).toBe(tool);
    });
  });
});

describe('withCartTracking', () => {
  describe('create_cart', () => {
    it('saves cart ID from result', async () => {
      const tool = makeTool('create_cart');
      const tracked = withCartTracking(tool, SESSION);

      await tracked.execute({ line_items: [] });

      expect(getCartSessionId(SESSION)).toBe('new-id');
    });

    it('returns existing cart if one exists', async () => {
      setCartSessionId(SESSION, 'existing-cart');

      const executeFn = vi.fn();
      const tool = makeTool('create_cart', executeFn);
      const tracked = withCartTracking(tool, SESSION);

      const result = (await tracked.execute({ line_items: [] })) as Record<string, unknown>;
      expect(result['_note']).toContain('Cart already exists');
      expect(executeFn).not.toHaveBeenCalled();
      expect(mockCartGet).toHaveBeenCalledWith('existing-cart');
    });
  });

  describe('cancel_cart', () => {
    it('injects stored cart ID', async () => {
      setCartSessionId(SESSION, 'cart-123');
      const executeFn = vi.fn(async () => ({ status: 'cancelled' }));
      const tool = makeTool('cancel_cart', executeFn);
      const tracked = withCartTracking(tool, SESSION);

      await tracked.execute({});

      expect(executeFn).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cart-123' }),
      );
    });

    it('clears cart session after cancellation', async () => {
      setCartSessionId(SESSION, 'cart-123');
      const tool = makeTool('cancel_cart', vi.fn(async () => ({})));
      const tracked = withCartTracking(tool, SESSION);

      await tracked.execute({});

      expect(getCartSessionId(SESSION)).toBeUndefined();
    });

    it('returns error when no cart exists', async () => {
      const tool = makeTool('cancel_cart');
      const tracked = withCartTracking(tool, SESSION);

      const result = (await tracked.execute({})) as Record<string, string>;
      expect(result['error']).toContain('No active cart');
    });
  });

  describe('cart read/update tools', () => {
    for (const toolName of ['get_cart', 'update_cart']) {
      it(`${toolName}: injects stored cart ID`, async () => {
        setCartSessionId(SESSION, 'cart-123');
        const executeFn = vi.fn(async () => ({}));
        const tool = makeTool(toolName, executeFn);
        const tracked = withCartTracking(tool, SESSION);

        await tracked.execute({ some: 'param' });

        expect(executeFn).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'cart-123', some: 'param' }),
        );
      });

      it(`${toolName}: returns error when no cart`, async () => {
        const tool = makeTool(toolName);
        const tracked = withCartTracking(tool, SESSION);

        const result = (await tracked.execute({})) as Record<string, string>;
        expect(result['error']).toContain('No active cart');
      });
    }
  });

  describe('untracked tools', () => {
    it('returns tool unchanged for unknown names', () => {
      const tool = makeTool('create_checkout');
      const tracked = withCartTracking(tool, SESSION);
      expect(tracked).toBe(tool);
    });
  });
});
