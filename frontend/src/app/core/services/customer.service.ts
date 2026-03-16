import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerMaster } from '../models/customer.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private apiUrl = `${environment.apiUrl}/customers`;

    constructor(private http: HttpClient) { }

    getCustomers(pageNumber: number = 1, pageSize: number = 20, search?: string, companyId?: string): Observable<any> {
        let url = `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        if (search) url += `&search=${search}`;
        if (companyId) url += `&companyId=${companyId}`;
        return this.http.get<any>(url);
    }

    getCustomerById(id: string): Observable<CustomerMaster> {
        return this.http.get<CustomerMaster>(`${this.apiUrl}/${id}`);
    }

    createCustomer(customer: Partial<CustomerMaster>): Observable<CustomerMaster> {
        return this.http.post<CustomerMaster>(this.apiUrl, customer);
    }

    updateCustomer(id: string, customer: Partial<CustomerMaster>): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, customer);
    }

    deleteCustomer(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
