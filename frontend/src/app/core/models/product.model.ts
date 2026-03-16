export interface Product {
    id: string;
    productName: string;
    sku?: string;
    description?: string;
    unitPrice: number;
    taxRatePercent: number;
    category?: string; // e.g. "Software", "Hardware", "Service"
    isActive: boolean;
    stockQuantity?: number;
    imageUrl?: string;
    createdDate: string;
    updatedDate: string;
}
