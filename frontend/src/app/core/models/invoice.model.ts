export interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    orderId?: string;
    orderNumber?: string;
    companyId?: string;
    companyName?: string;
    customerId?: string;
    customerName?: string;
    status: string; // 'Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'
    subTotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    billingAddressText?: string;
    notes?: string;
    termsAndConditions?: string;
    createdDate: string;
    updatedDate: string;
    // Included line items (mapped from OrderItems backend mostly)
    items?: InvoiceItem[];
}

export interface InvoiceItem {
    id: string;
    productId?: string;
    productName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRatePercent: number;
    lineTotal: number;
}
