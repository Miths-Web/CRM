import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderMaster } from '../models/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = `${environment.apiUrl}/orders`;

    constructor(private http: HttpClient) { }

    getOrders(pageNumber: number = 1, pageSize: number = 20, status?: string): Observable<any> {
        let url = `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        if (status) url += `&status=${status}`;
        return this.http.get<any>(url);
    }

    getOrderById(id: string): Observable<OrderMaster> {
        return this.http.get<OrderMaster>(`${this.apiUrl}/${id}`);
    }

    createOrder(order: Partial<OrderMaster>): Observable<OrderMaster> {
        return this.http.post<OrderMaster>(this.apiUrl, order);
    }

    updateOrderStatus(id: string, status: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/status`, `"${status}"`, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    deleteOrder(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
