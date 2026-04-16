import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface ArticleCategory {
    id: string;
    name: string;
    description?: string;
}

export interface Article {
    id: string;
    categoryId: string;
    categoryName?: string;
    title: string;
    content: string;
    tags?: string;
    authorId: string;
    authorName?: string;
    isPublished: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateArticleDto {
    categoryId: string;
    title: string;
    content: string;
    tags?: string;
    isPublished: boolean;
}

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {
    private apiUrl = `${environment.apiUrl}/knowledgebase`;

    constructor(private http: HttpClient) { }

    getCategories(): Observable<ArticleCategory[]> {
        return this.http.get<ArticleCategory[]>(`${this.apiUrl}/categories`);
    }

    createCategory(dto: any): Observable<ArticleCategory> {
        return this.http.post<ArticleCategory>(`${this.apiUrl}/categories`, dto);
    }

    getArticles(page = 1, pageSize = 100): Observable<Article[]> {
        return this.http.get<Article[]>(`${this.apiUrl}/articles?pageNumber=${page}&pageSize=${pageSize}`);
    }

    getArticleById(id: string): Observable<Article> {
        return this.http.get<Article>(`${this.apiUrl}/articles/${id}`);
    }

    createArticle(dto: CreateArticleDto): Observable<Article> {
        return this.http.post<Article>(`${this.apiUrl}/articles`, dto);
    }

    updateArticle(id: string, dto: CreateArticleDto): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/articles/${id}`, dto);
    }

    deleteArticle(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/articles/${id}`);
    }
}
