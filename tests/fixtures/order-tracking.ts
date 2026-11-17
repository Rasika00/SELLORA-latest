// Test-only data. The application never imports these fixtures.
import type { OrderTracking } from "../../src/lib/api/order-tracking";
import type { CustomerOrderRecord } from "../../src/lib/api/client";

export const trackingOrder: OrderTracking = {
  id: "test-order-1",
  orderNumber: "ORD-TEST-1",
  status: "SHIPPED",
  carrierName: "Test Courier",
  trackingNumber: "TEST-PKG-123",
  estimatedDelivery: "2026-11-20T00:00:00.000Z",
  createdAt: "2026-11-16T02:00:00.000Z",
  updatedAt: "2026-11-18T04:00:00.000Z",
  trackingEvents: [
    { id: "event-1", status: "PENDING", note: null, createdAt: "2026-11-16T02:00:00.000Z" },
    {
      id: "event-2",
      status: "PROCESSING",
      note: "Preparing your order",
      createdAt: "2026-11-17T03:00:00.000Z",
    },
    {
      id: "event-3",
      status: "SHIPPED",
      note: "Handed to the courier",
      createdAt: "2026-11-18T04:00:00.000Z",
    },
  ],
};

export const customerOrder: CustomerOrderRecord = {
  id: trackingOrder.id,
  orderNumber: trackingOrder.orderNumber,
  status: "PENDING",
  userId: "test-customer",
  customerName: "Test Customer",
  customerEmail: "test@example.test",
  shippingAddress: "Test street",
  city: "Colombo",
  totalAmount: 1000,
  createdAt: trackingOrder.createdAt,
  updatedAt: trackingOrder.createdAt,
  items: [
    {
      id: "test-item-1",
      productId: "test-product-1",
      price: 1000,
      quantity: 1,
      product: {
        id: "test-product-1",
        name: "Test Laptop",
        badge: "",
        badgeColor: "cyan",
        category: "Gaming",
        processor: "Intel i7",
        price: 1000,
        cpu: "Test CPU",
        gpu: "Test GPU",
        ram: "16GB",
        img: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
      },
    },
  ],
};
