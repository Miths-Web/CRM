import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KnowledgeBaseService, Article, ArticleCategory } from './services/knowledge-base.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, BookOpen, Plus, Trash2, Edit2, Eye } from 'lucide-angular';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Knowledge Base</h2>
          <p class="page-subtitle">Manage FAQs and Support Articles</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" (click)="openCategoryModal()">Manage Categories</button>
          <button class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Article</button>
        </div>
      </div>

      <div class="flex-center" style="padding:2rem" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="card" style="padding:0; overflow:hidden" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th><th>Category</th><th>Author</th><th>Status</th>
              <th>Views</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of articles()" (click)="openEditModal(a)" style="cursor:pointer">
              <td><strong>{{a.title}}</strong></td>
              <td>{{a.categoryName}}</td>
              <td>{{a.authorName}}</td>
              <td>
                <span class="badge" [ngClass]="{'badge-green':a.isPublished,'badge-gray':!a.isPublished}">
                  {{a.isPublished ? 'Published' : 'Draft'}}
                </span>
              </td>
              <td><lucide-icon [img]="Eye" class="w-3 h-3 inline-icon"></lucide-icon> {{a.viewCount}}</td>
              <td>{{a.createdAt | date:'shortDate'}}</td>
              <td (click)="$event.stopPropagation()">
                <button class="btn-icon flex-center" (click)="confirmDelete(a)"><lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="articles().length === 0">
          <div class="empty-icon text-muted"><lucide-icon [img]="BookOpen"></lucide-icon></div>
          <div class="empty-title">No articles found</div>
          <p class="empty-text">Create knowledge base articles.</p>
        </div>
      </div>

      <!-- Article Modal -->
      <app-modal [isOpen]="showModal()" [title]="editingId() ? 'Edit Article' : 'New Article'" [maxWidth]="'700px'" (close)="closeModal()">
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input formControlName="title" class="form-control" placeholder="How to reset password" />
            <div class="text-xs text-danger mt-1" *ngIf="form.get('title')?.touched && form.get('title')?.invalid">Title is required</div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select formControlName="categoryId" class="form-control">
                <option *ngFor="let c of categories()" [value]="c.id">{{c.name}}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tags</label>
              <input formControlName="tags" class="form-control" placeholder="login, security" />
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Content *</label>
            <textarea formControlName="content" class="form-control" rows="8"></textarea>
          </div>
          <div class="form-group" style="margin-top:1rem; flex-direction: row; align-items:center; gap:0.5rem">
            <input type="checkbox" formControlName="isPublished" id="chkPub" />
            <label for="chkPub" class="form-label" style="margin:0">Publish immediately</label>
          </div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving() || form.invalid">
            {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create')}}
          </button>
        </div>
      </app-modal>

      <!-- Category Modal (Basic) -->
      <app-modal [isOpen]="showCatModal()" title="Create Category" [maxWidth]="'400px'" (close)="closeCatModal()">
        <div class="form-group">
          <label class="form-label">Category Name</label>
          <input #catName class="form-control" placeholder="e.g. Troubleshooting" />
        </div>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeCatModal()">Cancel</button>
          <button class="btn btn-primary" (click)="createCategory(catName.value); catName.value=''">Create</button>
        </div>
      </app-modal>

      <app-confirm-dialog [isOpen]="showDeleteDialog()" title="Delete Article?"
        [message]="'Delete article ' + (deletingItem()?.title ?? '') + '?'"
        (confirm)="doDelete()" (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `
})
export class KnowledgeBaseComponent implements OnInit {
  articles = signal<Article[]>([]);
  categories = signal<ArticleCategory[]>([]);
  showModal = signal(false);
  showCatModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  deletingItem = signal<Article | null>(null);
  saving = signal(false);
  loading = signal(true);

  readonly BookOpen = BookOpen;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;

  form: FormGroup;

  constructor(
    private kbService: KnowledgeBaseService,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      content: ['', Validators.required],
      tags: [''],
      isPublished: [true]
    });
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.kbService.getCategories().subscribe(res => {
      this.categories.set(res);
      if (res.length > 0 && !this.form.value.categoryId) {
        this.form.patchValue({ categoryId: res[0].id });
      }
    });
    this.kbService.getArticles().subscribe({
      next: data => { this.articles.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  openCreateModal() { 
    if(this.categories().length === 0) {
      this.toast.warning('Not Allowed', 'Please create a category first.');
      return;
    }
    this.editingId.set(null); 
    this.form.reset({ isPublished: true, categoryId: this.categories()[0]?.id }); 
    this.showModal.set(true); 
  }
  openEditModal(a: Article) { this.editingId.set(a.id); this.form.patchValue(a); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  
  openCategoryModal() { this.showCatModal.set(true); }
  closeCatModal() { this.showCatModal.set(false); }

  createCategory(name: string) {
    if(!name) return;
    this.kbService.createCategory({ name }).subscribe(() => {
      this.toast.success('Success', 'Category created');
      this.closeCatModal();
      this.loadAll();
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const dto = this.form.value;
    const obs: any = this.editingId() ? this.kbService.updateArticle(this.editingId()!, dto) : this.kbService.createArticle(dto);
    
    obs.subscribe({ 
      next: () => { 
        this.saving.set(false); 
        this.closeModal(); 
        this.loadAll(); 
        this.toast.success('Success', this.editingId() ? 'Article updated' : 'Article created');
      }, 
      error: () => { this.saving.set(false); } 
    });
  }

  confirmDelete(a: Article) { this.deletingItem.set(a); this.showDeleteDialog.set(true); }
  doDelete() { 
    this.kbService.deleteArticle(this.deletingItem()!.id).subscribe({ 
      next: () => { 
        this.showDeleteDialog.set(false); 
        this.loadAll(); 
        this.toast.success('Deleted', 'Article deleted');
      } 
    }); 
  }
}
