import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MessageSquare, Star, User, Loader2, Filter, Reply, CheckCircle } from 'lucide-angular';
import { FeedbackService, Feedback } from '../../core/services/feedback.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-feedbacks',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './feedbacks.component.html',
  styleUrls: ['./feedbacks.component.scss']
})
export class FeedbacksComponent implements OnInit {
  feedbacks: Feedback[] = [];
  users: any[] = [];
  isLoading = true;

  // Icons
  readonly MessageSquare = MessageSquare;
  readonly Star = Star;
  readonly User = User;
  readonly Loader2 = Loader2;
  readonly Filter = Filter;
  readonly Reply = Reply;
  readonly CheckCircle = CheckCircle;

  statusFilter = 'All'; // All, New, InReview, Resolved

  canEdit = false;

  constructor(
    private feedbackService: FeedbackService,
    private settingsService: SettingsService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.canEdit = this.authService.hasPermission('Feedbacks', 'Update');
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.settingsService.getAllUsers().subscribe({
      next: (u: any[]) => this.users = u,
      error: () => { /* ignore 403 if user lacks Users.Read permission */ }
    });

    this.feedbackService.getAll().subscribe({
      next: (res) => {
        this.feedbacks = res;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Error', 'Failed to load feedbacks.');
        this.isLoading = false;
      }
    });
  }

  get filteredFeedbacks() {
    if (this.statusFilter === 'All') return this.feedbacks;
    return this.feedbacks.filter(f => f.status === this.statusFilter);
  }

  updateStatus(f: Feedback, newStatus: string) {
    this.feedbackService.updateStatus(f.id!, newStatus, f.assignedToUserId).subscribe({
      next: () => {
        f.status = newStatus;
        this.toast.success('Updated', `Feedback status changed to ${newStatus}`);
      },
      error: () => this.toast.error('Error', 'Status update failed.')
    });
  }

  assignUser(f: Feedback, userId: string) {
    this.feedbackService.updateStatus(f.id!, f.status, userId).subscribe({
      next: () => {
        f.assignedToUserId = userId;
        var u = this.users.find(x => x.id === userId);
        f.assignedToUserName = u ? `${u.firstName} ${u.lastName}` : '';
        this.toast.success('Assigned', 'Feedback assigned successfully.');
      },
      error: () => this.toast.error('Error', 'Assignment failed.')
    });
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
