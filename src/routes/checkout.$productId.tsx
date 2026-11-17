import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { getCheckoutProduct, type CheckoutProduct } from "@/lib/api/checkout";

export const Route = createFileRoute("/checkout/$productId")({ component: BuyNowCheckout });

function BuyNowCheckout() {
  const { productId } = Route.useParams();
  const [snapshot, setSnapshot] = useState<{
    id: string;
    product?: CheckoutProduct;
    error?: string;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getCheckoutProduct(productId, controller.signal).then(
      (product) => {
        if (!controller.signal.aborted) setSnapshot({ id: productId, product });
      },
      () => {
        if (!controller.signal.aborted)
          setSnapshot({
            id: productId,
            error:
              "This laptop could not be loaded or is unavailable. Return to the store and refresh the catalog.",
          });
      },
    );
    return () => controller.abort();
  }, [productId]);
  if (!snapshot || snapshot.id !== productId)
    return (
      <main className="min-h-screen grid place-items-center bg-background text-foreground">
        <p role="status">Loading laptop...</p>
      </main>
    );
  if (!snapshot.product)
    return (
      <main className="min-h-screen grid place-items-center bg-background text-foreground">
        <div className="max-w-md p-6 text-center">
          <p role="alert">{snapshot.error}</p>
          <Link to="/" className="mt-4 inline-block text-primary">
            Return to Store
          </Link>
        </div>
      </main>
    );
  return <CheckoutPage key={productId} items={[{ product: snapshot.product, quantity: 1 }]} />;
}
