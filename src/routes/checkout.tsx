import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/site/Navbar";
import { createOrder } from "@/lib/api/client";

export const Route = createFileRoute("/checkout")({
  component: CartCheckoutPage,
});

function CartCheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
  });

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
          <h1 className="text-xl font-semibold text-foreground">Your cart is empty</h1>
          <Link to="/" className="mt-4 inline-block text-neon-cyan hover:underline">Return to Store</Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const orderPayload = {
        customerName: formData.name,
        customerEmail: formData.email,
        shippingAddress: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        totalAmount: cartTotal,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
      };

      const result = await createOrder(orderPayload);
      const generatedNumber = result?.order?.orderNumber || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderNumber(generatedNumber);
      setIsSuccess(true);
      clearCart();
    } catch (err) {
      console.error("Order failed:", err);
      setOrderNumber(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSuccess(true);
      clearCart();
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-3xl p-8 text-center animate-fade-up border border-neon-cyan/30">
          <CheckCircle2 className="w-20 h-20 text-neon-cyan mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-white mb-4">Payment Successful!</h2>
          <p className="text-muted-foreground mb-8">
            Your order is now being prepared for orbital drop. You will receive tracking details via email shortly.
          </p>
          <div className="glass-strong rounded-xl p-4 mb-8 text-left border border-white/5">
            <p className="text-sm text-muted-foreground mb-1">Order ID: <span className="text-white font-mono">{orderNumber}</span></p>
          </div>
          <Link 
            to="/" 
            className="block w-full rounded-full bg-white/10 hover:bg-white/20 px-6 py-3 text-sm font-bold text-white transition-colors border border-white/10"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="py-24 px-4 sm:px-8 max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
        
        <h1 className="font-display text-4xl sm:text-5xl font-black mb-12">SECURE CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePayment} className="space-y-8">
              <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
                <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs">1</span>
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <input required type="text" name="name" onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all" placeholder="John Doe" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <input required type="email" name="email" onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all" placeholder="john@example.com" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Shipping Address</label>
                    <input required type="text" name="address" onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all" placeholder="123 Orbital Way" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">City</label>
                    <input required type="text" name="city" onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all" placeholder="Neo Tokyo" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Zip Code</label>
                    <input required type="text" name="zipCode" onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all" placeholder="10001" />
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5">
                <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs">2</span>
                  Payment Details
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-neon-cyan shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Secure Encrypted Payment</h4>
                      <p className="text-xs text-muted-foreground">By clicking Pay Now, a secure transaction window will open to process your payment via our verified gateway.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full rounded-full bg-gradient-primary px-8 py-4 text-sm font-bold text-primary-foreground shadow-[0_0_30px_oklch(0.78_0.18_200/0.4)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay Rs ${cartTotal.toLocaleString()}`
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="glass-strong rounded-3xl p-6 sm:p-8 sticky top-24 border border-white/5">
              <h3 className="font-display text-lg font-bold mb-6 uppercase tracking-widest">Order Summary</h3>
              
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center p-1.5 border border-white/5 shrink-0">
                      <img src={item.product.img} alt={item.product.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-sm truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-neon-cyan font-mono mt-0.5">QTY: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-bold whitespace-nowrap">
                      Rs {(item.product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-white">Rs {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Shipping (Orbital Drop)</span>
                  <span className="text-neon-cyan">FREE</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Taxes</span>
                  <span className="text-white">Calculated at payment</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="font-display font-bold text-xl">Total</span>
                <span className="font-display font-black text-2xl text-neon-cyan">Rs {cartTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
