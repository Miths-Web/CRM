import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, X, ArrowUp, ArrowDown, Edit2, Trash2, Inbox } from 'lucide-angular';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'date' | 'currency' | 'actions';
  badgeMap?: Record<string, string>; // value → badge CSS class
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="table-wrapper">
      <!-- Search + Actions Row -->
      <div class="table-toolbar" *ngIf="showToolbar">
        <div class="toolbar-left">
          <div class="search-box" *ngIf="searchable">
            <span class="search-icon flex-center"><lucide-icon [img]="Search" class="w-4 h-4"></lucide-icon></span>
            <input [(ngModel)]="searchTerm" (ngModelChange)="onSearch($event)"
                   class="search-input" [placeholder]="searchPlaceholder" />
            <button class="clear-btn flex-center" *ngIf="searchTerm" (click)="clearSearch()"><lucide-icon [img]="XIcon" class="w-3 h-3"></lucide-icon></button>
          </div>
          <span class="result-count">{{filteredData.length}} records</span>
        </div>
        <div class="toolbar-right">
          <ng-content select="[toolbar-actions]"></ng-content>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table class="data-table" *ngIf="filteredData.length > 0; else emptyTpl">
          <thead>
            <tr>
              <th *ngFor="let col of columns" [style.width]="col.width"
                  [class.sortable]="col.sortable" (click)="col.sortable && sortBy(col.key)">
                {{col.label}}
                <span *ngIf="col.sortable && sortKey === col.key" class="inline-flex align-middle relative" style="top:-1px">
                  <lucide-icon [img]="sortDir === 'asc' ? ArrowUp : ArrowDown" class="w-3 h-3"></lucide-icon>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of pagedData; trackBy: trackById"
                [class.selected]="selectedRows.has(row.id)"
                (click)="onRowClick(row)">
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.type">

                  <!-- Badge -->
                  <span *ngSwitchCase="'badge'"
                        class="badge"
                        [ngClass]="getBadgeClass(col, row[col.key])">
                    {{row[col.key]}}
                  </span>

                  <!-- Date -->
                  <span *ngSwitchCase="'date'">
                    {{row[col.key] ? (row[col.key] | date:'dd MMM yyyy') : '—'}}
                  </span>

                  <!-- Currency -->
                  <span *ngSwitchCase="'currency'">
                    {{row[col.key] ? ('₹' + (row[col.key] | number:'1.0-0')) : '—'}}
                  </span>

                  <!-- Actions -->
                  <div *ngSwitchCase="'actions'" class="action-btns" (click)="$event.stopPropagation()">
                    <ng-content select="[row-actions]"></ng-content>
                    <button class="btn-icon flex-center" (click)="onEdit.emit(row)" title="Edit"><lucide-icon [img]="Edit2" class="w-4 h-4"></lucide-icon></button>
                    <button class="btn-icon danger flex-center" (click)="onDelete.emit(row)" title="Delete"><lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon></button>
                  </div>

                  <!-- Default Text -->
                  <span *ngSwitchDefault>{{row[col.key] ?? '—'}}</span>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyTpl>
          <div class="empty-state">
            <div class="empty-icon text-muted"><lucide-icon [img]="Inbox" style="width:48px;height:48px;"></lucide-icon></div>
            <div class="empty-title">{{emptyTitle}}</div>
            <p class="empty-text">{{emptyText}}</p>
          </div>
        </ng-template>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredData.length > pageSize">
        <button class="page-btn" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">‹</button>
        <button class="page-btn" *ngFor="let p of pages"
                [class.active]="p === currentPage" (click)="goToPage(p)">{{p}}</button>
        <button class="page-btn" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">›</button>
        <span class="page-info">Page {{currentPage}} of {{totalPages}}</span>
      </div>
    </div>
  `,
  styles: [`
    .table-wrapper { display: flex; flex-direction: column; gap: 0; }

    .table-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem; background: var(--bg-card); border-radius: var(--radius-md) var(--radius-md) 0 0;
      border-bottom: 1px solid var(--border);
    }
    .toolbar-left { display: flex; align-items: center; gap: 1rem; }
    .toolbar-right { display: flex; align-items: center; gap: 0.5rem; }

    .search-box {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--bg-secondary); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 0.4rem 0.75rem; min-width: 240px;
      &:focus-within { border-color: var(--accent); }
    }
    .search-icon { font-size: 0.9rem; }
    .search-input { background: none; border: none; outline: none; color: var(--text-primary); font-size: 0.875rem; flex: 1; }
    .clear-btn    { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; }
    .result-count { font-size: 0.75rem; color: var(--text-muted); }

    .table-container { background: var(--bg-card); overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: var(--bg-secondary); padding: 0.75rem 1rem; text-align: left;
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
      color: var(--text-muted); border-bottom: 1px solid var(--border); white-space: nowrap; }
    .data-table th.sortable { cursor: pointer; user-select: none; &:hover { color: var(--accent-light); } }
    .data-table td { padding: 0.875rem 1rem; font-size: 0.875rem; color: var(--text-primary);
      border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--bg-hover); }
    .data-table tr.selected td { background: rgba(124,58,237,0.08); }

    .action-btns { display: flex; gap: 0.25rem; }
    .btn-icon { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 6px;
      padding: 0.3rem 0.5rem; cursor: pointer; font-size: 0.9rem; transition: var(--transition);
      &:hover { border-color: var(--accent); }
      &.danger:hover { border-color: var(--danger); background: rgba(239,68,68,0.1); }
    }

    .pagination { display: flex; align-items: center; gap: 0.25rem; padding: 0.75rem 1rem;
      background: var(--bg-card); border-top: 1px solid var(--border);
      border-radius: 0 0 var(--radius-md) var(--radius-md); }
    .page-btn { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 6px;
      padding: 0.3rem 0.6rem; cursor: pointer; color: var(--text-secondary); font-size: 0.8rem;
      transition: var(--transition);
      &:hover:not(:disabled) { border-color: var(--accent); color: var(--accent-light); }
      &.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .page-info { margin-left: auto; font-size: 0.75rem; color: var(--text-muted); }
  `]
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() pageSize = 10;
  @Input() searchable = true;
  @Input() showToolbar = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() emptyTitle = 'No data found';
  @Input() emptyText = 'Try adjusting your search or add new records.';
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onRowSelect = new EventEmitter<any>();

  readonly Search = Search;
  readonly XIcon = X;
  readonly ArrowUp = ArrowUp;
  readonly ArrowDown = ArrowDown;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Inbox = Inbox;

  searchTerm = '';
  sortKey = '';
  sortDir: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  selectedRows = new Set<string>();
  filteredData: any[] = [];
  pagedData: any[] = [];

  ngOnChanges() { this.applyFilters(); }

  onSearch(term: string) { this.searchTerm = term; this.currentPage = 1; this.applyFilters(); }
  clearSearch() { this.searchTerm = ''; this.applyFilters(); }

  sortBy(key: string) {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDir = 'asc'; }
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.data];
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v => String(v ?? '').toLowerCase().includes(t))
      );
    }
    if (this.sortKey) {
      result.sort((a, b) => {
        const av = a[this.sortKey] ?? '';
        const bv = b[this.sortKey] ?? '';
        return (av < bv ? -1 : av > bv ? 1 : 0) * (this.sortDir === 'asc' ? 1 : -1);
      });
    }
    this.filteredData = result;
    this.updatePage();
  }

  goToPage(p: number) { this.currentPage = p; this.updatePage(); }
  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
  }

  onRowClick(row: any) { this.onRowSelect.emit(row); }

  getBadgeClass(col: TableColumn, value: string): string {
    return col.badgeMap?.[value] ?? 'badge-gray';
  }

  get totalPages() { return Math.ceil(this.filteredData.length / this.pageSize); }
  get pages() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  trackById(_: number, item: any) { return item.id; }
}
