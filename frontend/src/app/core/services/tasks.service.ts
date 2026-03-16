import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Pending' | 'In Progress' | 'Done' | 'Cancelled';
    contactId?: string;
    contactName?: string;
    dealId?: string;
    dealTitle?: string;
    assignedTo?: string;
    assigneeName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskCreateDto {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
    contactId?: string;
    dealId?: string;
    assignedTo?: string;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
    constructor(private api: ApiService) { }

    getAll(params?: { status?: string; priority?: string; assignedTo?: string; dueDate?: string }): Observable<Task[]> {
        return this.api.get<Task[]>('tasks', params);
    }

    getById(id: string): Observable<Task> {
        return this.api.get<Task>(`tasks/${id}`);
    }

    create(dto: TaskCreateDto): Observable<Task> {
        return this.api.post<Task>('tasks', dto);
    }

    update(id: string, dto: Partial<TaskCreateDto>): Observable<Task> {
        return this.api.put<Task>(`tasks/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`tasks/${id}`);
    }

    markDone(id: string): Observable<Task> {
        return this.api.patch<Task>(`tasks/${id}/complete`, {});
    }

    updateStatus(id: string, status: string): Observable<Task> {
        return this.api.patch<Task>(`tasks/${id}/status`, { status });
    }

    /** Overdue tasks count — used for dashboard badge */
    getOverdueCount(): Observable<{ count: number }> {
        return this.api.get<{ count: number }>('tasks/overdue-count');
    }
}
