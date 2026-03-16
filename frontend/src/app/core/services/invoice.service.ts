import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice } from '../models/invoice.model';
import { Payment } from '../models/payment.model';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    private apiUrl = `${environment.apiUrl}/invoices`;

    constructor(private http: HttpClient) { }

    getInvoices(pageNumber: number = 1, pageSize: number = 20, status?: string): Observable<any> {
        let url = `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        if (status) url += `&status=${status}`;
        return this.http.get<any>(url);
    }

    getInvoiceById(id: string): Observable<Invoice> {
        return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
    }

    createInvoice(invoice: Partial<Invoice>): Observable<Invoice> {
        return this.http.post<Invoice>(this.apiUrl, invoice);
    }

    // Generate an invoice directly from an Order
    generateFromOrder(orderId: string): Observable<Invoice> {
        return this.http.post<Invoice>(`${this.apiUrl}/from-order/${orderId}`, {});
    }

    recordPayment(invoiceId: string, payment: Partial<Payment>): Observable<Payment> {
        return this.http.post<Payment>(`${this.apiUrl}/${invoiceId}/payments`, payment);
    }
}
