export interface Payment {
    id: string;
    invoiceId: string;
    invoiceNumber?: string;
    paymentDate: string;
    amount: number;
    paymentMode: string; // 'Bank Transfer', 'Credit Card', 'Cash', 'UPI', 'Cheque'
    transactionReference?: string;
    notes?: string;
    receivedById?: string;
    receivedByName?: string;
    createdDate: string;
}
