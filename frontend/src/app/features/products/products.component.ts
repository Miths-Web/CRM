import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import {
  LucideAngularModule, Search, Plus, Package, Edit2, Trash2, X,
  Tag, AlignLeft, Percent, DollarSign, Layers
} from 'lucide-angular';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="animate-fadeIn page-container">
      <div class="glass-header">
        <div>
          <h2 class="page-title"><lucide-icon [img]="Package" class="inline-icon"></lucide-icon> Products & Services</h2>
          <p class="page-subtitle">Manage your catalog, pricing, and tax rates.</p>
        </div>
        <div class="flex gap-3">
          <div class="search-box">
            <lucide-icon [img]="Search" class="search-icon"></lucide-icon>
            <input type="text" placeholder="Search products..." [value]="searchQuery()" (input)="onSearch($event)">
          </div>
          <button class="btn btn-primary" (click)="openModal()"><lucide-icon [img]="Plus" class="btn-icon"></lucide-icon> Add Product</button>
        </div>
      </div>

      <div class="card mt-4 p-0">
        <div class="p-6 text-center" *ngIf="loading()">
            <div class="spinner"></div><p class="text-muted mt-3">Loading catalog...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && products().length > 0">
          <thead>
            <tr>
              <th>Product Info</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Tax Rate</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of products()">
              <td>
                <div class="flex items-center gap-3">
                  <div class="avatar-bg border-circle"><lucide-icon [img]="Package" class="w-5 h-5 text-accent"></lucide-icon></div>
                  <div>
                    <div class="font-bold text-primary">{{ p.productName }}</div>
                    <div class="text-xs text-muted">{{ p.sku || 'No SKU' }}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge" *ngIf="p.category">{{ p.category }}</span><span class="text-muted text-sm" *ngIf="!p.category">—</span></td>
              <td class="font-bold">₹{{ p.unitPrice | number:'1.2-2' }}</td>
              <td class="text-sm font-medium">{{ p.taxRatePercent }}%</td>
              <td>
                <span class="badge" [ngClass]="p.isActive ? 'badge-success' : 'badge-danger'">
                  {{ p.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button class="action-btn" (click)="openModal(p)" title="Edit"><lucide-icon [img]="Edit2" class="w-4 h-4"></lucide-icon></button>
                  <button class="action-btn text-danger" (click)="deleteProduct(p.id)" title="Delete"><lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading() && products().length === 0">
          <div class="empty-icon"><lucide-icon [img]="Package"></lucide-icon></div>
          <h3>No products found</h3>
          <p class="text-muted">You haven't added any products to your catalog yet.</p>
          <button class="btn btn-primary mt-4" (click)="openModal()">Add Product</button>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-content animate-slideUp">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Edit Product' : 'New Product' }}</h3>
            <button class="close-btn" (click)="closeModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <form [formGroup]="form" (ngSubmit)="saveProduct()">
            <div class="modal-body form-grid">
              
              <div class="form-group col-span-2">
                <label>Product/Service Name <span class="required">*</span></label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Package" class="input-icon"></lucide-icon>
                  <input type="text" formControlName="productName" class="form-control"
                    [class.is-invalid]="isInvalid('productName')"
                    placeholder="e.g. Enterprise License">
                </div>
                <div class="error-msg" *ngIf="isInvalid('productName')">Product name is required.</div>
              </div>

              <div class="form-group">
                <label>SKU (Stock Keeping Unit)</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Tag" class="input-icon"></lucide-icon>
                  <input type="text" formControlName="sku" class="form-control" placeholder="PRD-001">
                </div>
              </div>

              <div class="form-group">
                <label>Category</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Layers" class="input-icon"></lucide-icon>
                  <input type="text" formControlName="category" class="form-control" placeholder="Software">
                </div>
              </div>

              <div class="form-group">
                <label>Unit Price (₹) <span class="required">*</span></label>
                <div class="input-with-icon">
                  <lucide-icon [img]="DollarSign" class="input-icon"></lucide-icon>
                  <input type="number" formControlName="unitPrice" class="form-control"
                    [class.is-invalid]="isInvalid('unitPrice')"
                    placeholder="1000" min="0" step="0.01">
                </div>
                <div class="error-msg" *ngIf="isInvalid('unitPrice')">Please enter a valid price (₹0 or above).</div>
              </div>

              <div class="form-group">
                <label>Tax Rate (%)</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Percent" class="input-icon"></lucide-icon>
                  <input type="number" formControlName="taxRatePercent" class="form-control"
                    [class.is-invalid]="isInvalid('taxRatePercent')"
                    placeholder="18" min="0" max="100" step="0.01">
                </div>
                <div class="error-msg" *ngIf="isInvalid('taxRatePercent')">Tax rate must be between 0% and 100%.</div>
              </div>

              <div class="form-group col-span-2">
                <label>Description</label>
                <div class="input-with-icon align-top">
                  <lucide-icon [img]="AlignLeft" class="input-icon mt-2"></lucide-icon>
                  <textarea formControlName="description" class="form-control" rows="3" placeholder="Specs and details..."></textarea>
                </div>
              </div>

              <div class="form-group col-span-2 flex items-center gap-2 mt-2">
                <input type="checkbox" formControlName="isActive" id="isActive" class="w-4 h-4">
                <label for="isActive" class="mb-0 cursor-pointer">Product is Active (available for sale)</label>
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                <span *ngIf="saving()" class="spinner-sm mr-2"></span>
                {{ editingId() ? 'Update' : 'Save' }} Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    
    .glass-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
    }

    .search-box { position: relative; display: flex; align-items: center; }
    .search-box input { padding: 0.65rem 1rem 0.65rem 2.5rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-primary); min-width: 260px; outline: none; }
    .search-box input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
    .search-icon { position: absolute; left: 0.8rem; width: 1.2rem; height: 1.2rem; color: var(--text-muted); }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:hover td { background: var(--bg-hover); }

    .avatar-bg { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(124, 58, 237, 0.1); }
    .action-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .action-btn { background: none; border: none; padding: 0.4rem; border-radius: 6px; cursor: pointer; color: var(--text-muted); transition: all 0.2s; }
    .action-btn:hover { background: var(--bg-secondary); color: var(--accent); }
    .action-btn.text-danger:hover { color: var(--danger); background: rgba(239,68,68,0.1); }
    
    .badge-success { background: rgba(16, 185, 129, 0.1); color: #059669; }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: #DC2626; }

    /* Modal Form Styles */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-content { background: var(--bg-primary); width: 100%; max-width: 600px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; flex-direction: column; max-height: 90vh; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .col-span-2 { grid-column: span 2; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.4rem; }
    .form-control { width: 100%; padding: 0.65rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); outline: none; transition: 0.2s; }
    .form-control:focus { border-color: var(--accent); }
    .input-with-icon { position: relative; display: flex; align-items: center; }
    .input-with-icon.align-top { align-items: flex-start; }
    .input-icon { position: absolute; left: 0.8rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }
    .input-with-icon .form-control { padding-left: 2.5rem; }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: rgba(124,58,237,0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .form-control.is-invalid { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
    .error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 4px; margin-left: 4px; }
    .required { color: #ef4444; }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
    .spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(false);

  searchQuery = signal('');
  searchTimeout: any;

  // Modal State
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);

  form: FormGroup;

  readonly Search = Search;
  readonly Plus = Plus;
  readonly Package = Package;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Tag = Tag;
  readonly AlignLeft = AlignLeft;
  readonly Percent = Percent;
  readonly DollarSign = DollarSign;
  readonly Layers = Layers;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(2)]],
      sku: [''],
      description: [''],
      unitPrice: [null, [Validators.required, Validators.min(0)]],
      taxRatePercent: [0, [Validators.min(0), Validators.max(100)]],
      category: [''],
      isActive: [true]
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.productService.getProducts(1, 100, this.searchQuery()).subscribe({
      next: (res: any) => {
        this.products.set(res.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        alert('Failed to load products.');
      }
    });
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 400);
  }

  openModal(product?: Product) {
    if (product) {
      this.editingId.set(product.id);
      this.form.patchValue(product);
    } else {
      this.editingId.set(null);
      this.form.reset({ unitPrice: 0, taxRatePercent: 0, isActive: true });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveProduct() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const payload = this.form.value;

    const req = this.editingId()
      ? this.productService.updateProduct(this.editingId()!, payload)
      : this.productService.createProduct(payload);

    (req as import('rxjs').Observable<any>).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadProducts();
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to save product.');
      }
    });
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: () => {
          alert('Failed to delete. Product may be linked to active orders.');
        }
      });
    }
  }
}
