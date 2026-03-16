export interface OrderMaster {
    id: string;
    orderNumber: string;
    orderDate: string;
    companyId?: string;
    companyName?: string;
    customerId?: string;
    customerName?: string;
    dealId?: string;
    dealTitle?: string;
    status: string; // 'Draft', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'
    billingAddressText?: string;
    shippingAddressText?: string;
    subTotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    notes?: string;
    createdDate: string;
    updatedDate: string;
    orderItems?: OrderItem[];
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxRatePercent: number;
    lineTotal: number;
}
