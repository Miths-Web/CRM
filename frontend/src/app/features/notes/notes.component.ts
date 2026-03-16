import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NoteService, Note, CreateNoteDto } from './services/note.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, FileText, Plus, Pin, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title"><lucide-icon [img]="FileText" class="inline-icon"></lucide-icon> Notes</h2>
          <p class="page-subtitle">Your personal notes and memos</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Note</button>
      </div>

      <!-- Notes Grid -->
      <div class="notes-grid" *ngIf="notes().length > 0; else emptyNotes">
        <div class="note-card" *ngFor="let note of notes()" (click)="openEditModal(note)">
          <div class="note-header">
            <span class="note-pin flex-center" *ngIf="note.isPinned"><lucide-icon [img]="Pin" class="w-4 h-4"></lucide-icon></span>
            <div class="note-category badge badge-purple" *ngIf="note.category">{{note.category}}</div>
            <button class="note-delete flex-center" (click)="$event.stopPropagation(); confirmDelete(note)"><lucide-icon [img]="Trash2" class="w-3 h-3"></lucide-icon></button>
          </div>
          <h4 class="note-title">{{note.title}}</h4>
          <p class="note-preview">{{note.content | slice:0:120}}{{note.content.length > 120 ? '...' : ''}}</p>
          <div class="note-footer">{{note.updatedAt | date:'dd MMM yyyy, HH:mm'}}</div>
        </div>
      </div>

      <ng-template #emptyNotes>
        <div class="card">
          <div class="empty-state">
            <div class="empty-icon text-muted"><lucide-icon [img]="FileText"></lucide-icon></div>
            <div class="empty-title">No notes yet</div>
            <p class="empty-text">Click "New Note" to capture your first idea.</p>
          </div>
        </div>
      </ng-template>

      <app-modal [isOpen]="showModal()" [title]="editingId() ? 'Edit Note' : 'New Note'" [maxWidth]="'580px'" (close)="closeModal()">
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input formControlName="title" class="form-control" placeholder="Note title" />
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Content *</label>
            <textarea formControlName="content" class="form-control" rows="6" placeholder="Write your note here..."></textarea>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Category</label>
              <input formControlName="category" class="form-control" placeholder="e.g. Meeting, Idea, Todo" />
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:0.5rem;padding-top:1.5rem">
              <input type="checkbox" formControlName="isPinned" id="pinCheck" style="width:16px;height:16px;accent-color:var(--accent)" />
              <label for="pinCheck" class="flex-center" style="cursor:pointer;color:var(--text-secondary);font-size:0.875rem"><lucide-icon [img]="Pin" class="w-4 h-4 mr-1" style="margin-right:0.25rem"></lucide-icon> Pin this note</label>
            </div>
          </div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving() || form.invalid">
            {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Save Note')}}
          </button>
        </div>
      </app-modal>

      <app-confirm-dialog [isOpen]="showDeleteDialog()" title="Delete Note?"
        [message]="'Delete note: ' + (deletingNote()?.title ?? '') + '?'"
        (confirm)="doDelete()" (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .note-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 1.25rem; cursor: pointer; transition: var(--transition); position: relative;
      &:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow-glow); }
    }
    .note-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .note-pin { font-size: 0.9rem; }
    .note-category { font-size: 0.65rem; }
    .note-delete { margin-left: auto; background: none; border: none; color: var(--text-muted); cursor: pointer;
      font-size: 0.75rem; opacity: 0; transition: var(--transition); border-radius: 4px; padding: 2px 5px;
      &:hover { background: rgba(239,68,68,0.1); color: var(--danger); }
    }
    .note-card:hover .note-delete { opacity: 1; }
    .note-title   { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary); }
    .note-preview { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.75rem; }
    .note-footer  { font-size: 0.7rem; color: var(--text-muted); }
  `]
})
export class NotesComponent implements OnInit {
  notes = signal<Note[]>([]);
  showModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  deletingNote = signal<Note | null>(null);
  saving = signal(false);

  readonly FileText = FileText;
  readonly Plus = Plus;
  readonly Pin = Pin;
  readonly Trash2 = Trash2;

  form: FormGroup;
  constructor(private noteService: NoteService, private toast: ToastService, private fb: FormBuilder) {
    this.form = this.fb.group({ title: ['', Validators.required], content: ['', Validators.required], category: [''], isPinned: [false] });
  }

  ngOnInit() { this.load(); }
  load() { this.noteService.getPaged().subscribe({ next: d => this.notes.set(d.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))) }); }

  openCreateModal() { this.editingId.set(null); this.form.reset({ isPinned: false }); this.showModal.set(true); }
  openEditModal(n: Note) { this.editingId.set(n.id); this.form.patchValue(n); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const obs: any = this.editingId() ? this.noteService.update(this.editingId()!, this.form.value) : this.noteService.create(this.form.value);
    obs.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.load(); }, error: (e: any) => { this.saving.set(false); this.toast.error('Save Failed', e.message ?? 'Could not save note.'); } });
  }

  confirmDelete(n: Note) { this.deletingNote.set(n); this.showDeleteDialog.set(true); }
  doDelete() { this.noteService.delete(this.deletingNote()!.id).subscribe({ next: () => { this.showDeleteDialog.set(false); this.load(); } }); }
}
