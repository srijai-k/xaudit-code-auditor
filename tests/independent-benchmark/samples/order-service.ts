interface OrderItem {
    sku: string;
    quantity: number;
    unitPrice: number;
}

interface Order {
    id: string;
    customerId: string;
    items: OrderItem[];
    status: "pending" | "paid" | "shipped" | "cancelled";
}

// A typical TypeScript service module: interfaces, a small class, some
// business logic, no I/O, no dangerous APIs. Verifies TS syntax parses
// cleanly and produces no findings by itself.
export class OrderService {
    private orders = new Map<string, Order>();

    createOrder(customerId: string, items: OrderItem[]): Order {
        const order: Order = {
            id: crypto.randomUUID(),
            customerId,
            items,
            status: "pending",
        };
        this.orders.set(order.id, order);
        return order;
    }

    getTotal(orderId: string): number {
        const order = this.orders.get(orderId);
        if (!order) throw new Error(`Order ${orderId} not found`);
        return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    }

    markPaid(orderId: string): void {
        const order = this.orders.get(orderId);
        if (!order) throw new Error(`Order ${orderId} not found`);
        order.status = "paid";
    }
}
