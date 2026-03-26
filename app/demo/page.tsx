import { DemoChat } from './DemoChat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Momentum — AI Shopping Agent Demo',
  description:
    'Watch a full purchase flow powered by the Universal Commerce Protocol: product search, cart, checkout, and order — all via natural conversation.',
};

export default function DemoPage() {
  return <DemoChat />;
}
