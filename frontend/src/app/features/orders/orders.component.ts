import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import {
  LucideAngularModule, Search, ShoppingCart, X, Plus, Trash2,
  CheckCircle, AlertTriangle, Filter, RefreshCw, FileText, Package
} from 'lucide-angular';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe, FormsModule],
  template: `
    <div class="animate-fadeIn page-container">

      <!-- Header -->
      <div class="glass-header">
        <div>
          <h2 class="page-title">Incoming Orders</h2>
          <p class="page-subtitle">View all orders — track status of every customer order.</p>
        </div>
        <div class="flex gap-2 items-center">
          <button class="btn btn-secondary btn-sm" (click)="loadOrders()">
            <lucide-icon [img]="RefreshCw" class="w-4 h-4 mr-1"></lucide-icon> Refresh
          </button>
          <button *ngIf="canCreate" class="btn btn-primary btn-sm" (click)="openCreateModal()" id="new-order-btn">
            <lucide-icon [img]="Plus" class="w-4 h-4 mr-1"></lucide-icon> New Order
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar" *ngIf="!loading()">
        <div class="stat-pill"><span class="stat-label">Total Orders</span><span class="stat-num text-primary">{{ orders().length }}</span></div>
        <div class="stat-pill"><span class="stat-label">Draft</span><span class="stat-num text-muted">{{ countByStatus('Draft') }}</span></div>
        <div class="stat-pill"><span class="stat-label">Confirmed</span><span class="stat-num text-warning">{{ countByStatus('Confirmed') }}</span></div>
        <div class="stat-pill"><span class="stat-label">Active</span><span class="stat-num text-accent">{{ countByStatus('Active') }}</span></div>
        <div class="stat-pill"><span class="stat-label">Completed</span><span class="stat-num text-success">{{ countByStatus('Completed') }}</span></div>
        <div class="stat-pill"><span class="stat-label">Total Value</span><span class="stat-num text-success">&#8377;{{ totalRevenue() | number:'1.0-0' }}</span></div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar card p-3 mt-4 mb-0" style="border-bottom-left-radius:0;border-bottom-right-radius:0;">
        <div class="search-box">
          <lucide-icon [img]="Search" class="search-icon"></lucide-icon>
          <input type="text" placeholder="Search by order number, customer, company..." [value]="searchQuery()" (input)="setSearch($any($event.target).value)">
        </div>
        <div class="flex items-center gap-2">
          <lucide-icon [img]="Filter" class="w-4 h-4 text-muted"></lucide-icon>
          <select class="filter-select" [value]="statusFilter()" (change)="setStatus($any($event.target).value)">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="card mt-0 p-0" style="border-top-left-radius:0;border-top-right-radius:0;border-top:none;">
        <div class="p-6 text-center" *ngIf="loading()">
          <div class="spinner"></div><p class="text-muted mt-3">Loading orders...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && filteredOrders().length > 0">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Company</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of filteredOrders()" (click)="viewOrderDetails(o)" class="cursor-pointer">
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar-bg"><lucide-icon [img]="ShoppingCart" class="w-4 h-4 text-accent"></lucide-icon></div>
                  <strong class="text-primary">{{ o.orderNumber }}</strong>
                </div>
              </td>
              <td class="text-sm text-muted">{{ o.orderDate | date:'dd MMM yyyy' }}</td>
              <td class="text-sm font-medium">{{ o.customerName || '&#8212;' }}</td>
              <td class="text-sm text-muted">{{ o.companyName || '&#8212;' }}</td>
              <td><span class="badge">{{ o.itemCount || 0 }} items</span></td>
              <td class="font-bold">&#8377;{{ o.totalAmount | number:'1.2-2' }}</td>
              <td>
                <select *ngIf="canEdit" class="status-select" [ngClass]="statusClass(o.status)"
                  [value]="o.status"
                  (change)="updateStatus(o, $any($event.target).value, $event)"
                  (click)="$event.stopPropagation()">
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <span *ngIf="!canEdit" class="badge" [ngClass]="statusBadgeClass(o.status)">{{ o.status }}</span>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button class="action-btn text-accent" (click)="viewOrderDetails(o); $event.stopPropagation()" title="View Details">
                    <lucide-icon [img]="FileText" class="w-4 h-4"></lucide-icon>
                  </button>
                  <button *ngIf="canEdit" class="action-btn text-danger" (click)="deleteOrder(o.id); $event.stopPropagation()" title="Delete">
                    <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="!loading() && filteredOrders().length === 0">
          <div class="empty-icon"><lucide-icon [img]="ShoppingCart"></lucide-icon></div>
          <h3>No orders found</h3>
          <p class="text-muted">{{ searchQuery() || statusFilter() ? 'Try clearing the filters.' : 'No customer orders yet.' }}</p>
          <button *ngIf="canCreate" class="btn btn-primary mt-4" (click)="openCreateModal()">
            <lucide-icon [img]="Plus" class="w-4 h-4 mr-2"></lucide-icon> Create First Order
          </button>
        </div>
      </div>

      <!-- Toast -->
      <div *ngIf="toast()" class="toast-notification" [class.toast-success]="toast()?.type==='success'" [class.toast-error]="toast()?.type==='error'">
        <lucide-icon [img]="toast()?.type==='success' ? CheckCircle : AlertTriangle" class="w-5 h-5 mr-2"></lucide-icon>
        {{ toast()?.message }}
      </div>

      <!-- ═══ CREATE ORDER MODAL ═══ -->
      <div class="modal-backdrop" *ngIf="showCreateModal()">
        <div class="modal-content animate-slideUp" style="max-width:650px;">
          <div class="modal-header">
            <div>
              <h3>New Order</h3>
              <p class="text-xs text-muted mt-1">Select customer and add products</p>
            </div>
            <button class="close-btn" (click)="closeCreateModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <div class="modal-body">

            <!-- Customer Selection -->
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-input" [(ngModel)]="newOrder.customerId" id="order-customer-select">
                <option value="">&#8212; Select Customer &#8212;</option>
                <option *ngFor="let c of customers" [value]="c.id">{{ c.firstName }} {{ c.lastName }}{{ c.companyName ? ' (' + c.companyName + ')' : '' }}</option>
              </select>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="form-label">Order Status</label>
              <select class="form-input" [(ngModel)]="newOrder.status">
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            <!-- Product Line Items -->
            <div class="form-group">
              <div class="flex justify-between items-center mb-2">
                <label class="form-label mb-0">Products *</label>
                <button type="button" class="btn btn-secondary btn-sm" (click)="addLineItem()">
                  <lucide-icon [img]="Plus" class="w-3 h-3 mr-1"></lucide-icon> Add Product
                </button>
              </div>

              <div class="line-items-container">
                <div *ngIf="newOrder.items.length === 0" class="empty-items">
                  <lucide-icon [img]="Package" class="w-8 h-8 text-muted"></lucide-icon>
                  <p class="text-muted text-sm mt-2">No products added. Click "Add Product" above.</p>
                </div>

                <div class="line-item" *ngFor="let item of newOrder.items; let i = index">
                  <div class="line-item-product">
                    <select class="form-input form-input-sm" [(ngModel)]="item.productId" (change)="onProductChange(item)">
                      <option value="">&#8212; Select Product &#8212;</option>
                      <option *ngFor="let p of products" [value]="p.id">{{ p.productName }} &#8212; &#8377;{{ p.unitPrice | number:'1.0-0' }}</option>
                    </select>
                  </div>
                  <div class="line-item-qty">
                    <input type="number" class="form-input form-input-sm text-center" [(ngModel)]="item.quantity" min="1" (ngModelChange)="calcLineTotal(item)" placeholder="Qty">
                  </div>
                  <div class="line-item-price text-accent font-bold text-sm">
                    &#8377;{{ item.lineTotal | number:'1.0-0' }}
                  </div>
                  <button class="action-btn text-danger" (click)="removeLineItem(i)" title="Remove">
                    <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>

                <!-- Order Total -->
                <div class="order-total" *ngIf="newOrder.items.length > 0">
                  <span class="text-muted text-sm">Order Total</span>
                  <span class="font-bold text-accent">&#8377;{{ getOrderTotal() | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label class="form-label">Notes (optional)</label>
              <textarea class="form-input" rows="2" [(ngModel)]="newOrder.notes" placeholder="Any special instructions..."></textarea>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="saveOrder()" [disabled]="saving()">
              <lucide-icon [img]="saving() ? RefreshCw : ShoppingCart" class="w-4 h-4 mr-2"></lucide-icon>
              {{ saving() ? 'Creating...' : 'Create Order' }}
            </button>
          </div>
        </div>
      </div>

      <!-- View Order Details Modal -->
      <div class="modal-backdrop" *ngIf="viewingOrder()">
        <div class="modal-content animate-slideUp" style="max-width:580px;">
          <div class="modal-header">
            <div>
              <h3>Order Details</h3>
              <p class="text-xs text-muted mt-1">{{ viewingOrder()?.orderNumber }}</p>
            </div>
            <button class="close-btn" (click)="closeViewModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <div class="modal-body">
            <div class="detail-grid mb-4">
              <div class="detail-card"><p class="detail-label">Customer</p><p class="detail-value">{{ viewingOrder()?.customerName || '&#8212;' }}</p></div>
              <div class="detail-card"><p class="detail-label">Company</p><p class="detail-value">{{ viewingOrder()?.companyName || '&#8212;' }}</p></div>
              <div class="detail-card"><p class="detail-label">Order Date</p><p class="detail-value">{{ viewingOrder()?.orderDate | date:'mediumDate' }}</p></div>
              <div class="detail-card">
                <p class="detail-label">Status</p>
                <span class="badge mt-1" [ngClass]="statusBadgeClass(viewingOrder()?.status)">{{ viewingOrder()?.status }}</span>
              </div>
            </div>
            <div *ngIf="viewingOrder()?.items?.length" class="mb-4">
              <h4 class="section-label mb-2">Products in this Order</h4>
              <div class="product-list">
                <div *ngFor="let item of viewingOrder()?.items" class="product-row">
                  <div>
                    <p class="font-medium text-sm">{{ item.productName || 'Custom Item' }}</p>
                    <p class="text-xs text-muted">Qty: {{ item.quantity }} &times; &#8377;{{ item.unitPrice | number:'1.2-2' }}</p>
                  </div>
                  <span class="font-bold text-sm text-accent">&#8377;{{ item.lineTotal | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
            <div class="financial-summary">
              <div class="fin-row"><span>SubTotal</span><span>&#8377;{{ viewingOrder()?.subTotal | number:'1.2-2' }}</span></div>
              <div class="fin-row"><span>Tax</span><span>&#8377;{{ viewingOrder()?.taxAmount | number:'1.2-2' }}</span></div>
              <div class="fin-row total"><span>Total</span><span>&#8377;{{ viewingOrder()?.totalAmount | number:'1.2-2' }}</span></div>
            </div>
          </div>
          <div class="modal-footer" style="display:flex; justify-content:space-between;">
            <button type="button" class="btn btn-outline" style="border:1px solid #dc2626; color:#dc2626;" *ngIf="canEdit" (click)="deleteOrder(viewingOrder().id); closeViewModal()">
              <lucide-icon [img]="Trash2" class="w-4 h-4 mr-2" style="display:inline-block; vertical-align:middle;"></lucide-icon> Delete Order
            </button>
            <button type="button" class="btn btn-secondary" style="margin-left:auto;" (click)="closeViewModal()">Close</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1300px; margin: 0 auto; }
    .glass-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-radius:16px; margin-bottom:1.5rem; background:rgba(255,255,255,0.6); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.4); box-shadow:0 10px 30px -10px rgba(0,0,0,0.05); }
    .stats-bar { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .stat-pill { display:flex; flex-direction:column; align-items:center; background:var(--bg-primary); border:1px solid var(--border); border-radius:10px; padding:0.6rem 1.25rem; flex:1; min-width:100px; }
    .stat-label { font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; letter-spacing:0.05em; }
    .stat-num { font-size:1.3rem; font-weight:800; margin-top:2px; }
    .filter-bar { display:flex; gap:1rem; align-items:center; }
    .search-box { position:relative; display:flex; align-items:center; flex:1; }
    .search-box input { padding:0.6rem 1rem 0.6rem 2.5rem; border-radius:8px; border:1px solid var(--border); background:var(--bg-secondary); width:100%; outline:none; font-size:0.875rem; }
    .search-box input:focus { border-color:var(--accent); }
    .search-icon { position:absolute; left:0.8rem; width:1.1rem; height:1.1rem; color:var(--text-muted); }
    .filter-select { padding:0.55rem 1rem; border-radius:8px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:0.85rem; outline:none; cursor:pointer; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { text-align:left; padding:0.75rem 1rem; color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid var(--border); vertical-align:middle; }
    .data-table tr:hover td { background:var(--bg-hover); }
    .avatar-bg { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:rgba(124,58,237,0.1); flex-shrink:0; }
    .action-btn { background:none; border:none; padding:0.4rem; border-radius:6px; cursor:pointer; color:var(--text-muted); transition:all 0.2s; }
    .action-btn.text-accent:hover { color:var(--accent); background:rgba(124,58,237,0.1); }
    .action-btn.text-danger:hover { color:#dc2626; background:rgba(239,68,68,0.1); }
    .status-select { border:none; border-radius:20px; padding:0.3rem 0.65rem; font-size:0.78rem; font-weight:600; cursor:pointer; outline:none; appearance:none; }
    .status-draft { background:rgba(245,158,11,0.12);color:#D97706; }
    .status-confirmed { background:rgba(59,130,246,0.12);color:#2563EB; }
    .status-shipped { background:rgba(124,58,237,0.12);color:var(--accent); }
    .status-delivered { background:rgba(16,185,129,0.12);color:#059669; }
    .status-cancelled { background:rgba(239,68,68,0.12);color:#DC2626; }
    .modal-backdrop { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; }
    .modal-content { background:var(--bg-primary); width:100%; border-radius:16px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); display:flex; flex-direction:column; max-height:90vh; }
    .modal-header { padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; }
    .close-btn { background:none; border:none; color:var(--text-muted); cursor:pointer; }
    .modal-body { padding:1.5rem; overflow-y:auto; }
    .modal-footer { padding:1rem 1.5rem; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:0.75rem; background:var(--bg-secondary); border-radius:0 0 16px 16px; }
    .form-group { margin-bottom:1.25rem; }
    .form-label { display:block; font-size:0.78rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); margin-bottom:0.5rem; }
    .form-input { width:100%; padding:0.6rem 0.85rem; border-radius:8px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:0.875rem; outline:none; transition:border-color 0.2s; }
    .form-input:focus { border-color:var(--accent); }
    .form-input-sm { padding:0.4rem 0.65rem; font-size:0.8rem; }
    .line-items-container { border:1px solid var(--border); border-radius:10px; overflow:hidden; }
    .empty-items { padding:1.5rem; text-align:center; background:var(--bg-secondary); }
    .line-item { display:grid; grid-template-columns:1fr 80px 100px 36px; gap:0.5rem; align-items:center; padding:0.6rem 0.75rem; border-bottom:1px solid var(--border); background:var(--bg-primary); }
    .line-item:last-of-type { border-bottom:none; }
    .line-item-price { text-align:right; }
    .order-total { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:rgba(124,58,237,0.06); border-top:2px solid var(--border); }
    .section-label { font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); }
    .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    .detail-card { background:var(--bg-secondary); border-radius:10px; padding:0.75rem 1rem; border:1px solid var(--border); }
    .detail-label { font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; margin-bottom:0.3rem; }
    .detail-value { font-size:0.9rem; font-weight:600; }
    .product-list { border:1px solid var(--border); border-radius:10px; overflow:hidden; }
    .product-row { display:flex; justify-content:space-between; align-items:center; padding:0.65rem 1rem; border-bottom:1px solid var(--border); }
    .product-row:last-child { border-bottom:none; }
    .financial-summary { background:var(--bg-secondary); border-radius:10px; padding:1rem; border:1px solid var(--border); }
    .fin-row { display:flex; justify-content:space-between; font-size:0.875rem; margin-bottom:0.5rem; padding-bottom:0.5rem; border-bottom:1px dashed var(--border); }
    .fin-row:last-child { margin-bottom:0; padding-bottom:0; border-bottom:none; }
    .fin-row.total { font-size:1rem; font-weight:800; color:var(--text-primary); border-top:2px solid var(--border); padding-top:0.5rem; margin-top:0.25rem; }
    .toast-notification { position:fixed; bottom:2rem; right:2rem; z-index:2000; display:flex; align-items:center; padding:0.85rem 1.25rem; border-radius:12px; font-size:0.875rem; font-weight:500; box-shadow:0 8px 32px rgba(0,0,0,0.15); animation:slideUp 0.3s ease; min-width:280px; }
    .toast-success { background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#059669; }
    .toast-error { background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#DC2626; }
    .btn-sm { padding:0.4rem 0.85rem; font-size:0.8rem; }
    .badge-warning { background:rgba(245,158,11,0.12);color:#D97706; }
    .badge-info { background:rgba(59,130,246,0.12);color:#2563EB; }
    .badge-accent { background:rgba(124,58,237,0.12);color:var(--accent); }
    .badge-success { background:rgba(16,185,129,0.12);color:#059669; }
    .badge-danger { background:rgba(239,68,68,0.12);color:#DC2626; }
    .text-success { color:#059669; } .text-warning { color:#D97706; } .text-accent { color:var(--accent); }
    .text-danger { color:#dc2626; }
    .empty-state { padding:4rem 2rem; text-align:center; }
    .empty-icon { width:64px; height:64px; background:rgba(124,58,237,0.1); color:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; }
    .spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto; }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    .animate-slideUp { animation:slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
    .cursor-pointer { cursor:pointer; }
  `]
})
export class OrdersComponent implements OnInit {
  orders = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  viewingOrder = signal<any>(null);
  showCreateModal = signal(false);
  searchQuery = signal('');
  statusFilter = signal('');
  toast = signal<{message:string;type:'success'|'error'}|null>(null);

  canEdit = false;
  canCreate = false;

  customers: any[] = [];
  products: any[] = [];

  newOrder: {
    customerId: string;
    status: string;
    notes: string;
    items: { productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
  } = this.emptyOrder();

  filteredOrders = computed(() => {
    let list = this.orders();
    const s = this.statusFilter();
    const q = this.searchQuery().toLowerCase();
    if (s) list = list.filter(o => o.status === s);
    if (q) list = list.filter(o =>
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.companyName?.toLowerCase().includes(q)
    );
    return list;
  });

  totalRevenue = computed(() => this.orders().reduce((s, o) => s + (o.totalAmount ?? 0), 0));
  getOrderTotal(): number { return this.newOrder.items.reduce((s, i) => s + (i.lineTotal ?? 0), 0); }

  readonly Search = Search; readonly ShoppingCart = ShoppingCart; readonly X = X;
  readonly CheckCircle = CheckCircle; readonly AlertTriangle = AlertTriangle;
  readonly Filter = Filter; readonly RefreshCw = RefreshCw; readonly FileText = FileText;
  readonly Plus = Plus; readonly Trash2 = Trash2; readonly Package = Package;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // DB uses 'Write' for create/update permissions — check both
    this.canEdit = this.authService.hasPermission('Orders', 'Update') ||
                   this.authService.hasPermission('Orders', 'Write');
    // Only Sales Reps can create orders (per user request)
    this.canCreate = this.authService.hasRole('Sales Rep');
  }

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getOrders(1, 200).subscribe({
      next: (r: any) => { this.orders.set(r.items || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal() {
    this.newOrder = this.emptyOrder();
    this.showCreateModal.set(true);
    if (this.customers.length === 0) this.loadCustomers();
    if (this.products.length === 0) this.loadProducts();
  }

  closeCreateModal() { this.showCreateModal.set(false); }

  loadCustomers() {
    this.apiService.get<any>('customers?pageSize=200').subscribe({
      next: (r: any) => { this.customers = r.items || r || []; },
      error: () => {}
    });
  }

  loadProducts() {
    this.apiService.get<any>('products?pageSize=200').subscribe({
      next: (r: any) => { this.products = r.items || r || []; },
      error: () => {}
    });
  }

  addLineItem() {
    this.newOrder = {
      ...this.newOrder,
      items: [...this.newOrder.items, { productId: '', productName: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]
    };
  }

  removeLineItem(index: number) {
    const updated = [...this.newOrder.items];
    updated.splice(index, 1);
    this.newOrder = { ...this.newOrder, items: updated };
  }

  onProductChange(item: any) {
    const product = this.products.find((p: any) => p.id === item.productId);
    if (product) {
      item.productName = product.productName;
      item.unitPrice = product.unitPrice;
      item.lineTotal = product.unitPrice * (item.quantity || 1);
      // Force reference update so computed() reacts
      this.newOrder = { ...this.newOrder, items: [...this.newOrder.items] };
    }
  }

  calcLineTotal(item: any) {
    item.lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
    // Force reference update so computed() reacts
    this.newOrder = { ...this.newOrder, items: [...this.newOrder.items] };
  }

  saveOrder() {
    if (!this.newOrder.customerId) { this.showToast('Please select a customer.', 'error'); return; }
    if (this.newOrder.items.length === 0) { this.showToast('Please add at least one product.', 'error'); return; }
    if (this.newOrder.items.some((i: any) => !i.productId)) { this.showToast('Please select a product for each line.', 'error'); return; }

    this.saving.set(true);
    const payload = {
      customerId: this.newOrder.customerId,
      status: this.newOrder.status,
      notes: this.newOrder.notes,
      items: this.newOrder.items.map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal
      }))
    };

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCreateModal();
        this.showToast('Order created successfully!', 'success');
        this.loadOrders();
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Failed to create order. Please try again.', 'error');
      }
    });
  }

  countByStatus(s: string) { return this.orders().filter(o => o.status === s).length; }
  setSearch(q: string) { this.searchQuery.set(q); }
  setStatus(s: string) { this.statusFilter.set(s); }

  statusClass(s: string) {
    return {
      'status-draft': s==='Draft', 'status-confirmed': s==='Confirmed',
      'status-shipped': s==='Active' || s==='Shipped', 'status-delivered': s==='Completed' || s==='Delivered', 'status-cancelled': s==='Cancelled'
    };
  }
  statusBadgeClass(s: string) {
    return {
      'badge-warning': s==='Draft', 'badge-info': s==='Confirmed',
      'badge-accent': s==='Active' || s==='Shipped', 'badge-success': s==='Completed' || s==='Delivered', 'badge-danger': s==='Cancelled'
    };
  }

  updateStatus(order: any, status: string, e: Event) {
    e.stopPropagation();
    if (!this.canEdit) return;
    this.orderService.updateOrderStatus(order.id, status).subscribe({
      next: () => { this.showToast(`Order ${order.orderNumber} → ${status}`, 'success'); this.loadOrders(); },
      error: () => this.showToast('Failed to update status.', 'error')
    });
  }

  deleteOrder(id: string) {
    if(!confirm('Are you sure you want to delete this order?')) return;
    this.orderService.deleteOrder(id).subscribe({
      next: () => { this.showToast('Order deleted.', 'success'); this.loadOrders(); },
      error: () => this.showToast('Failed to delete order.', 'error')
    });
  }

  viewOrderDetails(order: any) {
    this.orderService.getOrderById(order.id).subscribe({
      next: r => this.viewingOrder.set(r),
      error: () => this.viewingOrder.set(order)
    });
  }

  closeViewModal() { this.viewingOrder.set(null); }

  showToast(message: string, type: 'success'|'error' = 'success') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3500);
  }

  private emptyOrder() {
    return { customerId: '', status: 'Draft', notes: '', items: [] as any[] };
  }
}
