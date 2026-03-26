export interface MockProduct {
  readonly id: string;
  readonly title: string;
  readonly price_cents: number;
  readonly currency: string;
  readonly in_stock: boolean;
  readonly image: string;
  readonly rating: number;
  readonly reviews: number;
  readonly snippet: string;
}

export interface MockTotalLine {
  readonly type: string;
  readonly amount: number;
  readonly display_text: string;
}

export interface MockCheckoutSession {
  readonly id: string;
  readonly status: string;
  readonly order_id?: string;
  readonly currency: string;
  readonly line_items: readonly {
    readonly item: { readonly title: string; readonly image?: string };
    readonly quantity: number;
  }[];
  readonly totals: readonly MockTotalLine[];
}

export const MOCK_PRODUCTS: readonly MockProduct[] = [
  {
    id: 'prod-001',
    title: 'TrailBlazer Waterproof Jacket',
    price_cents: 8999,
    currency: 'USD',
    in_stock: true,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=300&fit=crop&q=80',
    rating: 4.7,
    reviews: 342,
    snippet: '3-layer waterproof, sealed seams, adjustable hood',
  },
  {
    id: 'prod-002',
    title: 'Summit Pro Hiking Backpack 40L',
    price_cents: 12999,
    currency: 'USD',
    in_stock: true,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop&q=80',
    rating: 4.5,
    reviews: 189,
    snippet: 'Ergonomic 40L with rain cover and hydration sleeve',
  },
  {
    id: 'prod-003',
    title: 'UltraGrip Trail Running Shoes',
    price_cents: 11499,
    currency: 'USD',
    in_stock: true,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&q=80',
    rating: 4.8,
    reviews: 567,
    snippet: 'Vibram outsole, 4mm drop, rock plate protection',
  },
];

const JACKET_IMAGE =
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=300&fit=crop&q=80';

export const MOCK_CHECKOUT_CREATED: MockCheckoutSession = {
  id: 'chk_demo_abc123',
  status: 'incomplete',
  currency: 'USD',
  line_items: [
    { item: { title: 'TrailBlazer Waterproof Jacket', image: JACKET_IMAGE }, quantity: 1 },
  ],
  totals: [
    { type: 'subtotal', amount: 8999, display_text: 'Subtotal' },
    { type: 'total', amount: 8999, display_text: 'Total' },
  ],
};

export const MOCK_CHECKOUT_UPDATED: MockCheckoutSession = {
  id: 'chk_demo_abc123',
  status: 'incomplete',
  currency: 'USD',
  line_items: [
    { item: { title: 'TrailBlazer Waterproof Jacket', image: JACKET_IMAGE }, quantity: 1 },
  ],
  totals: [
    { type: 'subtotal', amount: 8999, display_text: 'Subtotal' },
    { type: 'shipping', amount: 599, display_text: 'Shipping' },
    { type: 'tax', amount: 768, display_text: 'Tax' },
    { type: 'total', amount: 10366, display_text: 'Total' },
  ],
};

export const MOCK_CHECKOUT_COMPLETED: MockCheckoutSession = {
  id: 'chk_demo_abc123',
  status: 'complete',
  order_id: 'ORD-20260326-001',
  currency: 'USD',
  line_items: [
    { item: { title: 'TrailBlazer Waterproof Jacket', image: JACKET_IMAGE }, quantity: 1 },
  ],
  totals: [
    { type: 'subtotal', amount: 8999, display_text: 'Subtotal' },
    { type: 'shipping', amount: 599, display_text: 'Shipping' },
    { type: 'tax', amount: 768, display_text: 'Tax' },
    { type: 'total', amount: 10366, display_text: 'Total' },
  ],
};

export interface DemoStep {
  readonly type: 'user' | 'agent';
  readonly text?: string;
  readonly toolName?: string;
  readonly toolResult?: unknown;
  readonly tooltip: {
    readonly title: string;
    readonly description: string;
  };
}

export const DEMO_SCRIPT: readonly DemoStep[] = [
  {
    type: 'agent',
    text: "Hey Sarah! I'm Scout, your shopping assistant. What are you looking for today?",
    tooltip: {
      title: 'Scout greets the customer',
      description:
        'The AI agent introduces itself. Behind the scenes, it already called ucp_discover to learn what the store supports \u2014 payment methods, shipping options, and API version.',
    },
  },
  {
    type: 'user',
    text: 'I need a waterproof jacket for hiking, under $100',
    tooltip: {
      title: 'Customer describes what they need',
      description:
        'Natural language request. Scout will interpret the intent, extract keywords ("waterproof jacket") and constraints ("under $100"), then search the store catalog.',
    },
  },
  {
    type: 'agent',
    toolName: 'ucp_search_products',
    toolResult: MOCK_PRODUCTS,
    tooltip: {
      title: 'Scout searches the catalog',
      description:
        'Calls GET /ucp/products?q=waterproof+jacket via the UCP REST binding. The gateway translates this to the store\u2019s native API (Magento REST, Shopware Store API, or Shopify Storefront GraphQL).',
    },
  },
  {
    type: 'agent',
    text: 'Here are the best matches! The **TrailBlazer Waterproof Jacket** at $89.99 is your best bet \u2014 3-layer waterproof with sealed seams and adjustable hood. 4.7 stars from 342 reviews. Want me to add it to cart?',
    tooltip: {
      title: 'Scout recommends a product',
      description:
        'The AI analyzes search results, filters by the $100 budget, and highlights the best match with key details. Product cards render inline with images, ratings, and stock status.',
    },
  },
  {
    type: 'user',
    text: "Yes, I'll take the TrailBlazer!",
    tooltip: {
      title: 'Customer selects a product',
      description:
        'Scout understands this is a purchase intent for the TrailBlazer jacket. Next it needs buyer info to create a checkout session.',
    },
  },
  {
    type: 'agent',
    text: "What's your name and email so I can set up the order?",
    tooltip: {
      title: 'Scout collects buyer info',
      description:
        'UCP checkout sessions require at minimum a buyer name and email. Scout asks naturally \u2014 no forms, no redirects.',
    },
  },
  {
    type: 'user',
    text: 'Sarah Chen, sarah@example.com',
    tooltip: {
      title: 'Buyer provides their details',
      description:
        'Scout extracts the name and email from natural text. It\u2019s ready to create the checkout session.',
    },
  },
  {
    type: 'agent',
    toolName: 'ucp_create_checkout',
    toolResult: MOCK_CHECKOUT_CREATED,
    tooltip: {
      title: 'Checkout session created',
      description:
        'Calls POST /ucp/checkout-sessions with line items and buyer info. The gateway creates a cart in the store backend and returns a session with totals.',
    },
  },
  {
    type: 'agent',
    text: 'Cart ready! Where should we ship it?',
    tooltip: {
      title: 'Scout asks for shipping address',
      description:
        'The checkout session is open. Scout needs a shipping destination to calculate shipping costs and tax.',
    },
  },
  {
    type: 'user',
    text: '123 Pine Street, Portland, OR 97201, US',
    tooltip: {
      title: 'Customer provides shipping address',
      description:
        'Scout parses the address into structured fields: street, city, region, postal code, and country (ISO 2-letter code).',
    },
  },
  {
    type: 'agent',
    toolName: 'ucp_update_checkout',
    toolResult: MOCK_CHECKOUT_UPDATED,
    tooltip: {
      title: 'Shipping and tax calculated',
      description:
        'Calls PATCH /ucp/checkout-sessions/:id with the fulfillment destination. The store calculates shipping ($5.99) and tax ($7.68). Updated totals are returned.',
    },
  },
  {
    type: 'agent',
    text: "Everything looks good. Here's your order summary \u2014 shall I place it?",
    tooltip: {
      title: 'Scout shows the final summary',
      description:
        'Before completing, Scout always asks for explicit confirmation. The order summary shows items, shipping, tax, and total \u2014 no hidden costs.',
    },
  },
  {
    type: 'user',
    text: 'Yes, place it!',
    tooltip: {
      title: 'Customer confirms the order',
      description:
        'Explicit confirmation received. Scout will now complete the checkout using the payment handler discovered in step 1.',
    },
  },
  {
    type: 'agent',
    toolName: 'ucp_complete_checkout',
    toolResult: MOCK_CHECKOUT_COMPLETED,
    tooltip: {
      title: 'Order placed!',
      description:
        'Calls POST /ucp/checkout-sessions/:id/complete with the payment instrument. The store processes the order and returns an order ID. The full flow \u2014 discovery to purchase \u2014 happened in one conversation.',
    },
  },
  {
    type: 'agent',
    text: 'All done! Your TrailBlazer jacket is on its way. Confirmation sent to sarah@example.com. Happy trails!',
    tooltip: {
      title: 'Order confirmed',
      description:
        'The order card shows the confirmation with product thumbnail, delivery timeline, and estimated delivery date. This entire flow works with any UCP-connected store \u2014 Magento, Shopware, or Shopify.',
    },
  },
];

export const ONBOARDING_STEPS = [
  {
    title: 'Meet Scout',
    description:
      'Your AI shopping assistant that connects to real stores through the Universal Commerce Protocol.',
    icon: '\u{1F50D}',
  },
  {
    title: 'How it works',
    description:
      'Scout searches products, builds your cart, handles shipping, and places the order \u2014 all through natural conversation.',
    steps: ['Search products', 'Add to cart', 'Set shipping', 'Place order'],
    icon: '\u{1F6D2}',
  },
  {
    title: 'Real store, real protocol',
    description:
      'This demo connects to a real e-commerce backend via UCP. The same flow works with Magento, Shopware, and Shopify stores.',
    icon: '\u{1F310}',
  },
  {
    title: "Today's scenario",
    description:
      'Sarah needs a waterproof hiking jacket under $100. Watch Scout find the perfect one and complete the purchase in under a minute.',
    icon: '\u{1F9E5}',
  },
];
