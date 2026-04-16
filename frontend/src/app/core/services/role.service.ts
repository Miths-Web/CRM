import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RolePermission {
  id?: string;
  module: string;
  permission: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: RolePermission[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/Roles`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  create(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  update(id: string, role: Partial<Role>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, role);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  assignPermission(roleId: string, module: string, permission: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${roleId}/permissions`, { module, permission });
  }

  removePermission(roleId: string, permissionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${roleId}/permissions/${permissionId}`);
  }
}
