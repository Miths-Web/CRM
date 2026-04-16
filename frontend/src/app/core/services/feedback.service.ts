import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Feedback {
  id?: string;
  customerId: string;
  customerName?: string;
  rating: number;
  category: string;
  subject: string;
  comments: string;
  status: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/Feedbacks`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.apiUrl);
  }

  getById(id: string): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.apiUrl}/${id}`);
  }

  create(feedback: Partial<Feedback>): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, feedback);
  }

  updateStatus(id: string, status: string, assignedToUserId?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status, assignedToUserId });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
