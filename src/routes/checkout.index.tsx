import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/checkout/")({ component: CartCheckout });

function CartCheckout() {
  const { items, clearCart } = useCart();
  return <CheckoutPage items={items} onConfirmed={clearCart} />;
}
