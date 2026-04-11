import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './system-prompt';

describe('buildSystemPrompt', () => {
  const prompt = buildSystemPrompt();

  it('includes catalog search tool reference', () => {
    expect(prompt).toContain('search_catalog');
  });

  it('does not reference deprecated search_products', () => {
    expect(prompt).not.toContain('search_products');
  });

  it('includes get_product tool reference', () => {
    expect(prompt).toContain('get_product');
  });

  it('includes cart tools in the flow', () => {
    expect(prompt).toContain('create_cart');
    expect(prompt).toContain('update_cart');
  });

  it('includes checkout tools in the flow', () => {
    expect(prompt).toContain('create_checkout');
    expect(prompt).toContain('update_checkout');
    expect(prompt).toContain('complete_checkout');
  });

  it('includes cancel_cart in cancellation section', () => {
    expect(prompt).toContain('cancel_cart');
  });

  it('includes escalation handling', () => {
    expect(prompt).toContain('requires_escalation');
    expect(prompt).toContain('continue_url');
  });

  it('includes fallback for servers without cart capability', () => {
    expect(prompt).toContain('no cart capability');
  });

  it('includes store-specific config from agent.config.json', () => {
    expect(prompt).toContain('sportswear');
  });

  it('enforces max 2 tool calls per turn', () => {
    expect(prompt).toContain('Maximum 2 tool calls per turn');
  });

  it('never mentions raw IDs to user', () => {
    expect(prompt).toContain('cart IDs');
    expect(prompt).toContain('checkout IDs');
  });
});
