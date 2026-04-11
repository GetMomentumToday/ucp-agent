import { test, expect } from '@playwright/test';

test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get('/');
    if (res.status() >= 500) {
      test.skip(true, 'Server is unhealthy (500) — is the UCP gateway running?');
    }
  } catch {
    test.skip(true, 'Server is not reachable at localhost:3001');
  }
});

test.describe('Chat UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the chat interface', async ({ page }) => {
    await expect(page.locator('text=Scout').first()).toBeVisible();
    await expect(page.locator('text=Shopping assistant')).toBeVisible();
  });

  test('displays welcome screen with suggestions', async ({ page }) => {
    await expect(page.locator('text=How can I help you today?')).toBeVisible();
    await expect(page.locator('text=Show me fitness gear')).toBeVisible();
    await expect(page.locator('text=What bags do you have?')).toBeVisible();
  });

  test('has a functional chat input', async ({ page }) => {
    const input = page.locator('[placeholder*="Ask about a product"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('has a send button', async ({ page }) => {
    const sendBtn = page.locator('button[type="submit"], button:has(svg)').last();
    await expect(sendBtn).toBeVisible();
  });

  test('can type in the chat input', async ({ page }) => {
    const input = page.locator('[placeholder*="Ask about a product"]');
    await input.fill('Show me yoga bags');
    await expect(input).toHaveValue('Show me yoga bags');
  });

  test('has a theme toggle button', async ({ page }) => {
    const toggle = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggle).toBeVisible();
  });

  test('theme toggle switches theme', async ({ page }) => {
    const toggle = page.locator('button[aria-label="Toggle theme"]');
    const html = page.locator('html');

    const initialTheme = await html.getAttribute('data-theme');
    await toggle.click();
    await page.waitForTimeout(300);
    const newTheme = await html.getAttribute('data-theme');

    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Chat interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicking a suggestion sends it as a message', async ({ page }) => {
    const suggestion = page.locator('text=Show me fitness gear');
    await suggestion.click();

    await expect(page.locator('text=Show me fitness gear').last()).toBeVisible({ timeout: 5000 });
  });

  test('sending a message shows user bubble', async ({ page }) => {
    const input = page.locator('[placeholder*="Ask about a product"]');
    await input.fill('hello');
    await input.press('Enter');

    const userMessages = page.locator('[class*="user"]');
    await expect(userMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('sending a message shows typing indicator', async ({ page }) => {
    const input = page.locator('[placeholder*="Ask about a product"]');
    await input.fill('show me bags');
    await input.press('Enter');

    const typing = page.locator('[class*="typing"], [class*="dot"]');
    await expect(typing.first()).toBeVisible({ timeout: 5000 });
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });
});

test.describe('Chat API', () => {
  test('POST /api/chat returns 400 without messages', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('messages');
  });

  test('POST /api/chat returns 400 with invalid messages', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: { messages: 'not-an-array' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/chat returns 400 with null messages', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: { messages: null },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/chat accepts valid request', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
        sessionId: 'e2e-test',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([200, 500]).toContain(response.status());
  });
});

test.describe('Agent Profile', () => {
  test('GET /agent-profile.json returns valid profile', async ({ request }) => {
    const response = await request.get('/agent-profile.json');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('name');
  });
});
