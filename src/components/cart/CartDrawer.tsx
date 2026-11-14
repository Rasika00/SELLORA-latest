import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { useEffect, useRef } from "react";

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        ref={drawerRef}
        className="w-full max-w-md h-full glass-strong border-l border-neon-cyan/30 shadow-[-10px_0_30px_rgba(0,255,255,0.1)] flex flex-col animate-fade-left"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-neon-cyan" />
            Orbital Drop Cart
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p>Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-neon-cyan hover:underline text-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl glass border border-white/5 relative group">
                <div className="w-20 h-20 rounded-xl bg-black flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                  <img src={item.product.img} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-display font-bold text-sm leading-tight pr-6">{item.product.name}</h3>
                    <p className="text-[10px] text-neon-cyan font-mono mt-1">{item.product.processor}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-sm">Rs {item.product.price.toLocaleString()}</p>
                    
                    <div className="flex items-center gap-3 bg-white/5 rounded-full px-2 py-1 border border-white/10">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="text-muted-foreground hover:text-white p-1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="text-muted-foreground hover:text-white p-1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(item.product.id)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/40">
            <div className="flex justify-between items-center mb-6">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display font-bold text-xl text-white">Rs {cartTotal.toLocaleString()}</span>
            </div>
            
            <button
              onClick={() => {
                setIsCartOpen(false);
                navigate({ to: "/checkout" });
              }}
              className="w-full group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-neon-cyan transition-transform hover:scale-[1.02]"
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
