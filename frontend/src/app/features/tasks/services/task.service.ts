import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface CrmTask {
    id: string; title: string; description?: string; dueDate?: string;
    priority: string; status: string; isCompleted: boolean;
    assignedToUserId?: string; assignedToUserName?: string; customerId?: string; relatedDealId?: string;
    createdAt: string;
}
export interface CreateTaskDto {
    title: string; description?: string; dueDate?: string;
    priority?: string; assignedToUserId?: string;
    customerId?: string; relatedDealId?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
    constructor(private api: ApiService) { }
    getPaged(page = 1, size = 20): Observable<CrmTask[]> { return this.api.get<CrmTask[]>('tasks', { pageNumber: page, pageSize: size }); }
    getById(id: string): Observable<CrmTask> { return this.api.get<CrmTask>(`tasks/${id}`); }
    getMyTasks(): Observable<CrmTask[]> { return this.api.get<CrmTask[]>('tasks/my-tasks'); }
    getOverdue(): Observable<CrmTask[]> { return this.api.get<CrmTask[]>('tasks/overdue'); }
    create(dto: CreateTaskDto): Observable<CrmTask> { return this.api.post<CrmTask>('tasks', dto); }
    update(id: string, dto: CreateTaskDto): Observable<void> { return this.api.put<void>(`tasks/${id}`, dto); }
    updateStatus(id: string, status: string): Observable<void> { return this.api.put<void>(`tasks/${id}/status`, { status }); }
    delete(id: string): Observable<void> { return this.api.delete<void>(`tasks/${id}`); }
}
