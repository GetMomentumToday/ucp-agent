import { NextResponse } from 'next/server';

const agentProfile = {
  name: 'UCP Shopping Assistant',
  description: 'AI-powered shopping assistant using the Universal Commerce Protocol',
  version: '0.1.0',
  capabilities: ['product_search', 'checkout', 'order_tracking'],
  contact: 'support@getmomentum.today',
};

export function GET(): NextResponse {
  return NextResponse.json(agentProfile);
}
