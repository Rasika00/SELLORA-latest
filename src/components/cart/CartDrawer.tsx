import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { useEffect, useRef } from "react";
import { useUIMode } from "@/context/UIModeContext";

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isSimple } = useUIMode();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCartOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-background/80 backdrop-blur-sm transition-opacity duration-300">
      <div 
        ref={drawerRef}
        className="w-full max-w-md h-full bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col animate-fade-left"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase flex items-center gap-2 text-foreground">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {isSimple ? "Your Cart" : "Orbital Drop Cart"}
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p>Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-primary hover:underline text-sm font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30 border border-border relative group">
                <div className="w-20 h-20 rounded-lg bg-secondary/50 flex items-center justify-center border border-border overflow-hidden shrink-0">
                  <img src={item.product.img} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-display font-bold text-sm leading-tight pr-6 text-foreground">{item.product.name}</h3>
                    <p className="text-[10px] text-primary font-mono mt-1">{item.product.processor}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-sm text-foreground">Rs {item.product.price.toLocaleString()}</p>
                    
                    <div className="flex items-center gap-3 bg-secondary rounded-full px-2 py-1 border border-border">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono w-4 text-center text-foreground">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(item.product.id)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-card/60">
            <div className="flex justify-between items-center mb-6">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display font-bold text-xl text-foreground">Rs {cartTotal.toLocaleString()}</span>
            </div>
            
            <button
              onClick={() => {
                setIsCartOpen(false);
                navigate({ to: "/checkout" });
              }}
              className="w-full group relative inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-8 py-3.5 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:shadow-md"
            >
              <span>Secure Checkout</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
