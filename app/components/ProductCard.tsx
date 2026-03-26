import styles from './ProductCard.module.css';

interface Product {
  readonly id: string;
  readonly title: string;
  readonly price_cents: number;
  readonly currency: string;
  readonly in_stock: boolean;
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
  return (
    <div className={styles.card}>
      <div className={styles.name}>{product.title}</div>
      <div className={styles.price}>{formatPrice(product.price_cents, product.currency)}</div>
      <div className={styles.stock}>
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
