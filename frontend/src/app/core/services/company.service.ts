import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanyMaster } from '../models/company.model';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private apiUrl = `${environment.apiUrl}/companies`;

    constructor(private http: HttpClient) { }

    getCompanies(pageNumber: number = 1, pageSize: number = 20, search?: string): Observable<any> {
        let url = `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        if (search) url += `&search=${search}`;
        return this.http.get<any>(url);
    }

    getCompanyById(id: string): Observable<CompanyMaster> {
        return this.http.get<CompanyMaster>(`${this.apiUrl}/${id}`);
    }

    createCompany(company: Partial<CompanyMaster>): Observable<CompanyMaster> {
        return this.http.post<CompanyMaster>(this.apiUrl, company);
    }

    updateCompany(id: string, company: Partial<CompanyMaster>): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, company);
    }

    deleteCompany(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
