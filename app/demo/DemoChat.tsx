'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DEMO_SCRIPT, ONBOARDING_STEPS, type DemoStep, type MockProduct } from './mock-data';
import s from './demo.module.css';

interface RenderedMessage {
  readonly id: string;
  readonly role: 'user' | 'agent';
  readonly text?: string;
  readonly toolName?: string;
  readonly toolState: 'running' | 'done';
  readonly toolResult?: unknown;
}

interface CheckoutSession {
  readonly id: string;
  readonly status: string;
  readonly order_id?: string;
  readonly currency: string;
  readonly totals?: readonly { type: string; amount: number; display_text?: string }[];
  readonly line_items?: readonly {
    item: { title: string; image?: string };
    quantity: number;
  }[];
}

function isProductArray(value: unknown): value is readonly MockProduct[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null &&
    'price_cents' in value[0]
  );
}

function isCheckoutSession(value: unknown): value is CheckoutSession {
  return typeof value === 'object' && value !== null && 'id' in value && 'status' in value;
}

function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function Stars({ rating }: { readonly rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={s.stars}>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f${i}`} className={s.starFull}>
          {'\u2605'}
        </span>
      ))}
      {half && <span className={s.starHalf}>{'\u2605'}</span>}
      <span className={s.ratingText}>{rating}</span>
    </span>
  );
}

function ProductCardsDemo({ products }: { readonly products: readonly MockProduct[] }) {
  return (
    <div className={s.productCards}>
      {products.map((p) => (
        <div key={p.id} className={s.productCard}>
          <div className={s.productImageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.title} className={s.productImage} />
            <span className={p.in_stock ? s.stockBadgeIn : s.stockBadgeOut}>
              {p.in_stock ? '\u2713 In Stock' : 'Sold Out'}
            </span>
          </div>
          <div className={s.productBody}>
            <div className={s.productName}>{p.title}</div>
            <div className={s.productSnippet}>{p.snippet}</div>
            <div className={s.productMeta}>
              <Stars rating={p.rating} />
              <span className={s.reviewCount}>({p.reviews})</span>
            </div>
            <div className={s.productPrice}>{formatCents(p.price_cents, p.currency)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckoutCard({ session }: { readonly session: CheckoutSession }) {
  const currency = session.currency ?? 'USD';
  const item = session.line_items?.[0];
  const subtotal = session.totals?.find((t) => t.type === 'subtotal');
  const shipping = session.totals?.find((t) => t.type === 'shipping');
  const tax = session.totals?.find((t) => t.type === 'tax');
  const total = session.totals?.find((t) => t.type === 'total');

  return (
    <div className={s.checkoutCard}>
      {item && (
        <div className={s.checkoutItem}>
          {item.item.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.item.image} alt={item.item.title} className={s.checkoutItemImg} />
          )}
          <div className={s.checkoutItemInfo}>
            <div className={s.checkoutItemName}>{item.item.title}</div>
            <div className={s.checkoutItemQty}>Qty: {item.quantity}</div>
          </div>
          {subtotal && (
            <div className={s.checkoutItemPrice}>{formatCents(subtotal.amount, currency)}</div>
          )}
        </div>
      )}
      <div className={s.checkoutLines}>
        {shipping ? (
          <div className={s.checkoutLine}>
            <span>Shipping</span>
            <span>{formatCents(shipping.amount, currency)}</span>
          </div>
        ) : (
          <div className={s.checkoutLinePending}>
            <span>Shipping</span>
            <span>Calculated after address</span>
          </div>
        )}
        {tax ? (
          <div className={s.checkoutLine}>
            <span>Tax</span>
            <span>{formatCents(tax.amount, currency)}</span>
          </div>
        ) : (
          <div className={s.checkoutLinePending}>
            <span>Tax</span>
            <span>Calculated after address</span>
          </div>
        )}
      </div>
      {total && (
        <div className={s.checkoutTotal}>
          <span>Total</span>
          <span>{formatCents(total.amount, currency)}</span>
        </div>
      )}
    </div>
  );
}

function OrderCardDemo({ session }: { readonly session: CheckoutSession }) {
  const totalEntry = session.totals?.find((t) => t.type === 'total');
  const item = session.line_items?.[0];
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const deliveryStr = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={s.orderCard}>
      <div className={s.orderHeader}>
        <span className={s.orderCheck}>{'\u2713'}</span>
        <div>
          <div className={s.orderTitle}>Order Confirmed!</div>
          <div className={s.orderId}>#{session.order_id}</div>
        </div>
      </div>
      {item && (
        <div className={s.orderItem}>
          {item.item.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.item.image} alt={item.item.title} className={s.orderItemImage} />
          )}
          <div>
            <div className={s.orderItemName}>{item.item.title}</div>
            <div className={s.orderItemQty}>Qty: {item.quantity}</div>
          </div>
        </div>
      )}
      <div className={s.orderTimeline}>
        <div className={`${s.timelineStep} ${s.timelineActive}`}>
          <span className={s.timelineDot} />
          <span>Ordered</span>
        </div>
        <div className={s.timelineLine} />
        <div className={s.timelineStep}>
          <span className={s.timelineDot} />
          <span>Processing</span>
        </div>
        <div className={s.timelineLine} />
        <div className={s.timelineStep}>
          <span className={s.timelineDot} />
          <span>Shipped</span>
        </div>
        <div className={s.timelineLine} />
        <div className={s.timelineStep}>
          <span className={s.timelineDot} />
          <span>Delivered</span>
        </div>
      </div>
      <div className={s.orderFooter}>
        <div className={s.orderTotal}>
          Total: <strong>{formatCents(totalEntry?.amount ?? 0, session.currency)}</strong>
        </div>
        <div className={s.orderDelivery}>Est. delivery: {deliveryStr}</div>
      </div>
    </div>
  );
}

function renderToolResult(toolName: string, result: unknown) {
  if (!result || typeof result !== 'object') return null;
  if (toolName === 'ucp_search_products' && isProductArray(result))
    return <ProductCardsDemo products={result} />;
  if (toolName === 'ucp_complete_checkout' && isCheckoutSession(result) && result.order_id)
    return <OrderCardDemo session={result} />;
  if (
    (toolName === 'ucp_create_checkout' || toolName === 'ucp_update_checkout') &&
    isCheckoutSession(result) &&
    result.totals &&
    result.totals.length > 0
  )
    return <CheckoutCard session={result} />;
  return null;
}

function Onboarding({ onStart }: { readonly onStart: () => void }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step]!;
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div className={s.onboarding}>
      <div className={s.onboardingCard}>
        <div className={s.onboardingIcon}>{current.icon}</div>
        <div className={s.onboardingStep}>
          {step + 1} / {ONBOARDING_STEPS.length}
        </div>
        <h2 className={s.onboardingTitle}>{current.title}</h2>
        <p className={s.onboardingDesc}>{current.description}</p>
        {'steps' in current && current.steps && (
          <div className={s.onboardingFlow}>
            {current.steps.map((label, i) => (
              <div key={label} className={s.onboardingFlowStep}>
                <span className={s.onboardingFlowNum}>{i + 1}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        <div className={s.onboardingDots}>
          {ONBOARDING_STEPS.map((_, i) => (
            <button
              key={i}
              className={`${s.onboardingDot} ${i === step ? s.onboardingDotActive : ''}`}
              onClick={() => setStep(i)}
              type="button"
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>
        <div className={s.onboardingActions}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className={`${s.sidebarBtn} ${s.btnSecondary}`}
              type="button"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? onStart : () => setStep(step + 1)}
            className={`${s.sidebarBtn} ${s.btnPrimary}`}
            type="button"
          >
            {isLast ? '\u25B6 Start guided demo' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildMessagesUpTo(stepIndex: number): RenderedMessage[] {
  const msgs: RenderedMessage[] = [];
  for (let i = 0; i <= stepIndex && i < DEMO_SCRIPT.length; i++) {
    const step = DEMO_SCRIPT[i]!;
    if (step.toolName) {
      msgs.push({
        id: `msg-${i}-tool`,
        role: 'agent',
        toolName: step.toolName,
        toolState: 'done',
        toolResult: step.toolResult,
      });
    } else {
      msgs.push({
        id: `msg-${i}`,
        role: step.type === 'user' ? 'user' : 'agent',
        text: step.text,
        toolState: 'done',
      });
    }
  }
  return msgs;
}

function getLastMsgId(stepIndex: number): string {
  if (stepIndex < 0 || stepIndex >= DEMO_SCRIPT.length) return '';
  const step = DEMO_SCRIPT[stepIndex]!;
  return step.toolName ? `msg-${stepIndex}-tool` : `msg-${stepIndex}`;
}

export function DemoChat() {
  const [phase, setPhase] = useState<'guided' | 'finished'>('guided');
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<RenderedMessage[]>(() => {
    const step = DEMO_SCRIPT[0]!;
    return [{ id: 'msg-0', role: 'agent' as const, text: step.text, toolState: 'done' as const }];
  });
  const [animatingText, setAnimatingText] = useState<string | null>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const fullText = DEMO_SCRIPT[0]!.text ?? '';
      let idx = 0;
      typewriterRef.current = setInterval(() => {
        idx += 1;
        setAnimatingText(fullText.slice(0, idx));
        if (idx >= fullText.length) {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          typewriterRef.current = null;
          setAnimatingText(null);
        }
      }, 10);
    }
  }, []);

  useEffect(() => {
    const tooltip = document.querySelector('[class*="tourInline"]');
    if (tooltip) {
      tooltip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStep]);

  const cleanup = useCallback(() => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
  }, []);

  const typewriteMessage = useCallback((fullText: string, onComplete: () => void) => {
    let charIndex = 0;
    typewriterRef.current = setInterval(() => {
      charIndex += 1;
      setAnimatingText(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        setAnimatingText(null);
        onComplete();
      }
    }, 10);
  }, []);

  const advanceToStep = useCallback(
    (targetStep: number) => {
      cleanup();
      if (targetStep >= DEMO_SCRIPT.length) {
        setMessages(buildMessagesUpTo(DEMO_SCRIPT.length - 1));
        setAnimatingText(null);
        setCurrentStep(DEMO_SCRIPT.length - 1);
        setPhase('finished');
        return;
      }
      const prevMessages = targetStep > 0 ? buildMessagesUpTo(targetStep - 1) : [];
      setAnimatingText(null);
      setCurrentStep(targetStep);
      const step = DEMO_SCRIPT[targetStep]!;

      if (step.toolName) {
        setMessages([
          ...prevMessages,
          {
            id: `msg-${targetStep}-tool`,
            role: 'agent',
            toolName: step.toolName,
            toolState: 'running',
          },
        ]);
        setTimeout(() => {
          setMessages([
            ...prevMessages,
            {
              id: `msg-${targetStep}-tool`,
              role: 'agent',
              toolName: step.toolName!,
              toolState: 'done',
              toolResult: step.toolResult,
            },
          ]);
        }, 800);
      } else if (step.type === 'user') {
        setMessages([
          ...prevMessages,
          { id: `msg-${targetStep}`, role: 'user', text: step.text, toolState: 'done' },
        ]);
      } else {
        const fullText = step.text ?? '';
        setMessages([
          ...prevMessages,
          { id: `msg-${targetStep}`, role: 'agent', text: fullText, toolState: 'done' },
        ]);
        setAnimatingText('');
        typewriteMessage(fullText, () => {});
      }
    },
    [cleanup, typewriteMessage],
  );

  const handleNext = useCallback(() => {
    if (typewriterRef.current) {
      cleanup();
      setAnimatingText(null);
    }
    const next = currentStep + 1;
    if (next >= DEMO_SCRIPT.length) {
      setMessages(buildMessagesUpTo(DEMO_SCRIPT.length - 1));
      setPhase('finished');
    } else advanceToStep(next);
  }, [currentStep, advanceToStep, cleanup]);

  const handleBack = useCallback(() => {
    cleanup();
    setAnimatingText(null);
    advanceToStep(Math.max(0, currentStep - 1));
  }, [currentStep, advanceToStep, cleanup]);

  const startGuided = useCallback(() => {
    setPhase('guided');
    advanceToStep(0);
  }, [advanceToStep]);
  const resetDemo = useCallback(() => {
    cleanup();
    setPhase('guided');
    advanceToStep(0);
  }, [cleanup, advanceToStep]);

  const tooltip =
    currentStep >= 0 && currentStep < DEMO_SCRIPT.length ? DEMO_SCRIPT[currentStep]!.tooltip : null;
  const isLastStep = currentStep >= DEMO_SCRIPT.length - 1;
  const highlightId = getLastMsgId(currentStep);

  const getDisplayedText = (msg: RenderedMessage): string | undefined => {
    if (msg.id === `msg-${currentStep}` && animatingText !== null) return animatingText;
    return msg.text;
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.logo}>
          <span className={s.logoAccent}>Scout</span> by Momentum
        </div>
      </div>

      <div className={s.container}>
        <aside className={s.sidebar}>
          <div className={s.sidebarTitle}>
            <span className={s.sidebarTitleDot} />
            Scout
          </div>
          <div className={s.sidebarLabel}>Conversations</div>
          <div className={s.convItem + ' ' + s.convActive}>
            <span className={s.convIcon}>{'\u{1F9E5}'}</span>
            <div>
              <div className={s.convName}>Hiking jacket</div>
              <div className={s.convPreview}>Sarah &middot; Under $100</div>
            </div>
          </div>
          <div className={s.convItem}>
            <span className={s.convIcon}>{'\u{1F45F}'}</span>
            <div>
              <div className={s.convName}>Trail shoes</div>
              <div className={s.convPreview}>Mike &middot; Technical</div>
            </div>
          </div>
          <div className={s.convItem}>
            <span className={s.convIcon}>{'\u{1F392}'}</span>
            <div>
              <div className={s.convName}>Backpack 40L</div>
              <div className={s.convPreview}>Anna &middot; Multi-day</div>
            </div>
          </div>
          <div className={s.convNew}>+ New conversation</div>
          <div className={s.spacer} />
          <div className={s.debugItem}>
            <span className={s.protocolBadge} style={{ fontSize: 9 }}>
              UCP v1.0
            </span>
          </div>
        </aside>

        <div className={s.chatArea}>
          <div className={s.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`${s.avatar} ${s.agentAvatar}`} style={{ margin: 0 }}>
                S
              </span>
              <div>
                <div className={s.chatHeaderTitle}>Scout</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Shopping assistant</div>
              </div>
            </div>
          </div>

          <div className={s.messages}>
            {messages.map((msg) => {
              const isHighlighted = msg.id === highlightId;
              const dimClass = phase === 'guided' && !isHighlighted ? s.msgDimmed : '';

              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className={`${s.msg} ${s.userMsg} ${dimClass}`}>
                    <div className={`${s.avatar} ${s.userAvatar}`}>S</div>
                    <div
                      className={`${s.bubble} ${s.userBubble} ${isHighlighted ? s.bubbleHighlight : ''}`}
                    >
                      <div className={s.bubbleText}>{msg.text}</div>
                    </div>
                    {isHighlighted && tooltip && (
                      <Tooltip
                        tooltip={tooltip}
                        step={currentStep}
                        total={DEMO_SCRIPT.length}
                        isLast={isLastStep}
                        isAnimating={animatingText !== null}
                        onNext={handleNext}
                        onBack={handleBack}
                        onClose={resetDemo}
                      />
                    )}
                  </div>
                );
              }

              const displayText = getDisplayedText(msg);
              return (
                <div key={msg.id} className={`${s.msg} ${s.agentMsg} ${dimClass}`}>
                  {msg.text && <div className={`${s.avatar} ${s.agentAvatar}`}>S</div>}
                  {msg.toolName && (
                    <div className={s.toolIndicator}>
                      <span
                        className={`${s.toolDot} ${msg.toolState === 'done' ? s.toolDotDone : s.toolDotRunning}`}
                      />
                      {msg.toolState === 'done' ? 'called' : 'calling'} {msg.toolName}
                    </div>
                  )}
                  {msg.toolResult !== undefined &&
                    msg.toolResult !== null &&
                    msg.toolName !== undefined && (
                      <div className={isHighlighted ? s.resultHighlight : ''}>
                        {renderToolResult(msg.toolName, msg.toolResult)}
                      </div>
                    )}
                  {displayText !== undefined && (
                    <div
                      className={`${s.bubble} ${s.agentBubble} ${isHighlighted ? s.bubbleHighlight : ''}`}
                    >
                      <div className={s.bubbleText}>{displayText}</div>
                    </div>
                  )}
                  {isHighlighted && tooltip && (
                    <Tooltip
                      tooltip={tooltip}
                      step={currentStep}
                      total={DEMO_SCRIPT.length}
                      isLast={isLastStep}
                      isAnimating={animatingText !== null}
                      onNext={handleNext}
                      onBack={handleBack}
                      onClose={resetDemo}
                    />
                  )}
                </div>
              );
            })}

            {phase === 'finished' && (
              <div className={s.tourInline}>
                <div className={s.tourTitle}>{'\u{1F389}'} Demo complete!</div>
                <div className={s.tourDesc}>
                  Scout completed a full purchase through UCP. This flow works with any connected
                  store.
                </div>
                <div className={s.tourActions}>
                  <button
                    onClick={resetDemo}
                    className={`${s.tourBtn} ${s.tourBtnSecondary}`}
                    type="button"
                  >
                    Restart
                  </button>
                  <button
                    onClick={startGuided}
                    className={`${s.tourBtn} ${s.tourBtnPrimary}`}
                    type="button"
                  >
                    {'\u21BB'} Replay
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className={s.footer}>
        <span>Powered by</span>
        <strong style={{ color: '#64748b' }}>Momentum</strong>
        <div className={s.footerDivider} />
        <span className={s.protocolBadge}>UCP</span>
        <div className={s.footerDivider} />
        <span>Magento &middot; Shopware &middot; Shopify</span>
      </div>
    </div>
  );
}

interface TooltipProps {
  readonly tooltip: { title: string; description: string };
  readonly step: number;
  readonly total: number;
  readonly isLast: boolean;
  readonly isAnimating: boolean;
  readonly onNext: () => void;
  readonly onBack: () => void;
  readonly onClose: () => void;
}

function Tooltip({
  tooltip,
  step,
  total,
  isLast,
  isAnimating,
  onNext,
  onBack,
  onClose,
}: TooltipProps) {
  return (
    <div className={s.tourInline}>
      <div className={s.tourHeader}>
        <span className={s.tourStep}>
          {step + 1} of {total}
        </span>
        <button onClick={onClose} className={s.tourClose} type="button">
          {'\u2715'}
        </button>
      </div>
      <div className={s.tourTitle}>{tooltip.title}</div>
      <div className={s.tourDesc}>{tooltip.description}</div>
      <div className={s.tourActions}>
        <button
          onClick={onBack}
          disabled={step <= 0}
          className={`${s.tourBtn} ${s.tourBtnSecondary}`}
          type="button"
        >
          Back
        </button>
        <button onClick={onNext} className={`${s.tourBtn} ${s.tourBtnPrimary}`} type="button">
          {isAnimating ? 'Skip' : isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
