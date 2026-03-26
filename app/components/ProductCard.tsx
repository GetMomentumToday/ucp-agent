import styles from './ProductCard.module.css';

interface Product {
  readonly id: string;
  readonly title: string;
  readonly price_cents: number;
  readonly currency: string;
  readonly in_stock: boolean;
  readonly images?: readonly string[];
}

interface ProductCardProps {
  readonly product: Product;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0];

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.title} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <svg
              viewBox="0 0 24 24"
              width={24}
              height={24}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>
      <div className={styles.name}>{product.title}</div>
      <div className={styles.price}>{formatPrice(product.price_cents, product.currency)}</div>
      <div className={product.in_stock ? styles.stockIn : styles.stockOut}>
        {product.in_stock ? '\u2713 In stock' : '\u2717 Out of stock'}
      </div>
    </div>
  );
}

interface ProductCardsProps {
  readonly products: readonly Product[];
}

export function ProductCards({ products }: ProductCardsProps) {
  return (
    <div className={styles.cards}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
