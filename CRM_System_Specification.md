# CRM Portal - Complete System Specification

## 1. System Overview

### 1.1 Project Description
A comprehensive Customer Relationship Management (CRM) portal designed to manage customer interactions, sales pipelines, and business relationships. The system provides a modern, professional interface with role-based access control for different organizational levels.

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Angular | 17.x |
| UI Framework | Tailwind CSS | 3.x |
| Backend | .NET Web API | 8.0 |
| Language | C# | 12 |
| Database | MySQL | 8.0 |
| ORM | Entity Framework Core | 8.x |
| Authentication | JWT Bearer Tokens | - |
| API Documentation | Swagger/OpenAPI | 3.0 |

---

## 2. User Roles & Permissions

### 2.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrator with full access | Full CRUD on all modules, user management, system settings |
| **Manager** | Team lead with oversight capabilities | View all team data, manage team members, reports access |
| **Sales Rep** | Sales team member | CRUD on own records, view assigned leads/deals |
| **Support Agent** | Customer support personnel | View contacts, manage support-related tasks, notes |
| **Viewer** | Read-only access | View-only access to permitted modules |

### 2.2 Permission Matrix

| Module | Admin | Manager | Sales | Support | Viewer |
|--------|-------|---------|-------|---------|--------|
| Contacts | CRUD | CRUD | CRUD (own) | Read | Read |
| Leads | CRUD | CRUD | CRUD (own) | Read | Read |
| Deals | CRUD | CRUD | CRUD (own) | Read | Read |
| Tasks | CRUD | CRUD | CRUD (own) | CRUD (own) | Read |
| Calendar | CRUD | CRUD | CRUD (own) | CRUD (own) | Read |
| Email | CRUD | CRUD | CRUD (own) | CRUD (own) | - |
| Notes | CRUD | CRUD | CRUD (own) | CRUD (own) | Read |
| Reports | Full | Full | Limited | Limited | Limited |
| User Management | Full | Read | - | - | - |
| Settings | Full | Limited | - | - | - |

---

## 3. Module Specifications

### 3.1 Contacts Management

#### Features
- Create, read, update, delete contacts
- Contact categorization (Customer, Prospect, Partner, Vendor)
- Advanced search and filtering
- Import/Export (CSV, Excel)
- Contact timeline showing all interactions
- Duplicate detection
- Custom fields support

#### Contact Entity Fields
```
- Id (GUID)
- FirstName (string, required)
- LastName (string, required)
- Email (string, unique)
- Phone (string)
- Mobile (string)
- Company (string)
- JobTitle (string)
- Address (string)
- City (string)
- State (string)
- Country (string)
- PostalCode (string)
- Category (enum: Customer, Prospect, Partner, Vendor)
- Status (enum: Active, Inactive)
- Source (string)
- AssignedToUserId (GUID, FK)
- Tags (string[])
- CustomFields (JSON)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

---

### 3.2 Leads Management

#### Features
- Lead capture and creation
- Lead scoring system
- Lead status workflow (New → Contacted → Qualified → Converted → Lost)
- Lead assignment and routing
- Conversion to Contact/Deal
- Lead source tracking
- Bulk operations

#### Lead Entity Fields
```
- Id (GUID)
- Title (string, required)
- FirstName (string)
- LastName (string)
- Email (string)
- Phone (string)
- Company (string)
- JobTitle (string)
- Status (enum: New, Contacted, Qualified, Unqualified, Converted, Lost)
- Source (enum: Website, Referral, Social, Advertisement, Cold Call, Event, Other)
- Score (int, 0-100)
- EstimatedValue (decimal)
- Description (string)
- AssignedToUserId (GUID, FK)
- ConvertedToContactId (GUID, FK, nullable)
- ConvertedToDealId (GUID, FK, nullable)
- ConvertedAt (datetime, nullable)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

---

### 3.3 Deals/Sales Pipeline

#### Features
- Visual Kanban board with drag-and-drop
- Customizable pipeline stages
- Deal value and probability tracking
- Expected close date management
- Win/Loss tracking with reasons
- Deal-Contact association
- Revenue forecasting
- Deal timeline and activity log

#### Pipeline Stages (Default)
1. **Prospecting** - Initial contact made
2. **Qualification** - Needs identified
3. **Proposal** - Quote/proposal sent
4. **Negotiation** - Terms being discussed
5. **Closed Won** - Deal successful
6. **Closed Lost** - Deal unsuccessful

#### Deal Entity Fields
```
- Id (GUID)
- Title (string, required)
- Value (decimal, required)
- Currency (string, default: USD)
- Stage (enum: pipeline stages)
- Probability (int, 0-100)
- ExpectedCloseDate (date)
- ActualCloseDate (date, nullable)
- Status (enum: Open, Won, Lost)
- LostReason (string, nullable)
- ContactId (GUID, FK)
- CompanyName (string)
- Description (string)
- AssignedToUserId (GUID, FK)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

---

### 3.4 Tasks & Activities

#### Features
- Task creation with priorities
- Due date and reminder system
- Task assignment to users
- Task categories (Call, Meeting, Email, Follow-up, Other)
- Task status tracking
- Recurring tasks
- Task linking to Contacts, Leads, Deals
- Activity logging

#### Task Entity Fields
```
- Id (GUID)
- Title (string, required)
- Description (string)
- Type (enum: Call, Meeting, Email, Follow-up, Demo, Other)
- Priority (enum: Low, Medium, High, Urgent)
- Status (enum: Pending, InProgress, Completed, Cancelled)
- DueDate (datetime)
- ReminderDate (datetime, nullable)
- CompletedAt (datetime, nullable)
- AssignedToUserId (GUID, FK)
- RelatedContactId (GUID, FK, nullable)
- RelatedLeadId (GUID, FK, nullable)
- RelatedDealId (GUID, FK, nullable)
- IsRecurring (bool)
- RecurrencePattern (string, nullable)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

---

### 3.5 Calendar & Scheduling

#### Features
- Interactive calendar view (Day, Week, Month)
- Event creation and management
- Meeting scheduling
- Event reminders and notifications
- Calendar sharing
- Integration with Tasks
- Color-coded event types
- Drag-and-drop rescheduling

#### Event Entity Fields
```
- Id (GUID)
- Title (string, required)
- Description (string)
- Type (enum: Meeting, Call, Event, Reminder, Other)
- StartDateTime (datetime, required)
- EndDateTime (datetime, required)
- IsAllDay (bool)
- Location (string)
- Color (string)
- ReminderMinutes (int)
- AssignedToUserId (GUID, FK)
- Attendees (GUID[], FK to Users)
- RelatedContactId (GUID, FK, nullable)
- RelatedDealId (GUID, FK, nullable)
- IsRecurring (bool)
- RecurrenceRule (string, nullable)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

---

### 3.6 Email Integration

#### Features
- Email template management
- Bulk email sending
- Email tracking (opens, clicks)
- Email scheduling
- Template variables/merge fields
- Email history per contact
- Email analytics

#### Email Entity Fields
```
- Id (GUID)
- Subject (string, required)
- Body (string, required)
- FromEmail (string)
- ToEmail (string, required)
- CcEmails (string[])
- BccEmails (string[])
- Status (enum: Draft, Scheduled, Sent, Failed)
- ScheduledAt (datetime, nullable)
- SentAt (datetime, nullable)
- OpenedAt (datetime, nullable)
- ClickedAt (datetime, nullable)
- TemplateId (GUID, FK, nullable)
- RelatedContactId (GUID, FK, nullable)
- RelatedLeadId (GUID, FK, nullable)
- RelatedDealId (GUID, FK, nullable)
- CreatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

#### Email Template Entity
```
- Id (GUID)
- Name (string, required)
- Subject (string, required)
- Body (string, required)
- Category (string)
- IsActive (bool)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

---

### 3.7 Notes & Documents

#### Features
- Rich text notes
- Note categorization
- File attachments
- Link notes to entities (Contact, Lead, Deal)
- Document management
- Version history
- Search functionality

#### Note Entity Fields
```
- Id (GUID)
- Title (string, required)
- Content (string, required)
- Category (string)
- IsPinned (bool)
- RelatedContactId (GUID, FK, nullable)
- RelatedLeadId (GUID, FK, nullable)
- RelatedDealId (GUID, FK, nullable)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

#### Document Entity Fields
```
- Id (GUID)
- FileName (string, required)
- OriginalFileName (string)
- FilePath (string)
- FileSize (long)
- MimeType (string)
- Category (string)
- RelatedContactId (GUID, FK, nullable)
- RelatedLeadId (GUID, FK, nullable)
- RelatedDealId (GUID, FK, nullable)
- RelatedNoteId (GUID, FK, nullable)
- CreatedAt (datetime)
- CreatedByUserId (GUID, FK)
```

---

### 3.8 Reports & Analytics Dashboard

#### Features
- Interactive dashboard with KPIs
- Sales pipeline visualization
- Revenue forecasting
- Lead conversion analytics
- Activity reports
- User performance metrics
- Custom date range filtering
- Export to PDF/Excel

#### Dashboard Widgets
1. **Sales Overview**
   - Total revenue (current month/quarter/year)
   - Deals won vs lost
   - Average deal size
   - Win rate percentage

2. **Pipeline Analytics**
   - Deals by stage (funnel chart)
   - Pipeline value by stage
   - Expected revenue

3. **Lead Metrics**
   - New leads count
   - Lead conversion rate
   - Leads by source
   - Lead status distribution

4. **Activity Summary**
   - Tasks completed
   - Upcoming tasks
   - Overdue tasks
   - Activities by type

5. **Top Performers**
   - Sales by user
   - Deals closed by user
   - Activities by user

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram (Summary)

```
Users (1) ─────────────< Contacts (N)
  │                          │
  │                          │
  ├──────────────< Leads (N) ├──────────────< Notes (N)
  │                   │      │
  │                   │      │
  ├──────────────< Deals (N) ├──────────────< Documents (N)
  │                   │
  │                   │
  ├──────────────< Tasks (N)
  │
  │
  ├──────────────< Events (N)
  │
  │
  └──────────────< Emails (N)

Roles (N) <─────────────> Users (N)  [Many-to-Many via UserRoles]
```

### 4.2 Core Tables

```sql
-- Users & Authentication
Users
UserRoles
Roles
RefreshTokens

-- CRM Core
Contacts
Leads
Deals
DealStages
Tasks
Events
Notes
Documents

-- Email
Emails
EmailTemplates

-- System
AuditLogs
Settings
```

---

## 5. API Endpoints

### 5.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh-token` | Refresh JWT token |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user profile |

### 5.2 Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | Get all contacts (paginated) |
| GET | `/api/contacts/{id}` | Get contact by ID |
| POST | `/api/contacts` | Create new contact |
| PUT | `/api/contacts/{id}` | Update contact |
| DELETE | `/api/contacts/{id}` | Delete contact |
| GET | `/api/contacts/{id}/timeline` | Get contact activity timeline |
| POST | `/api/contacts/import` | Import contacts from CSV |
| GET | `/api/contacts/export` | Export contacts to CSV |

### 5.3 Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | Get all leads (paginated) |
| GET | `/api/leads/{id}` | Get lead by ID |
| POST | `/api/leads` | Create new lead |
| PUT | `/api/leads/{id}` | Update lead |
| DELETE | `/api/leads/{id}` | Delete lead |
| POST | `/api/leads/{id}/convert` | Convert lead to contact/deal |
| PUT | `/api/leads/{id}/status` | Update lead status |

### 5.4 Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | Get all deals (paginated) |
| GET | `/api/deals/{id}` | Get deal by ID |
| POST | `/api/deals` | Create new deal |
| PUT | `/api/deals/{id}` | Update deal |
| DELETE | `/api/deals/{id}` | Delete deal |
| PUT | `/api/deals/{id}/stage` | Update deal stage |
| GET | `/api/deals/pipeline` | Get pipeline view data |
| GET | `/api/deals/stages` | Get all deal stages |

### 5.5 Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks (paginated) |
| GET | `/api/tasks/{id}` | Get task by ID |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| PUT | `/api/tasks/{id}/status` | Update task status |
| GET | `/api/tasks/my-tasks` | Get current user's tasks |
| GET | `/api/tasks/overdue` | Get overdue tasks |

### 5.6 Calendar/Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get events (with date range) |
| GET | `/api/events/{id}` | Get event by ID |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/{id}` | Update event |
| DELETE | `/api/events/{id}` | Delete event |
| GET | `/api/events/upcoming` | Get upcoming events |

### 5.7 Emails

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | Get all emails (paginated) |
| GET | `/api/emails/{id}` | Get email by ID |
| POST | `/api/emails` | Create/send email |
| POST | `/api/emails/schedule` | Schedule email |
| GET | `/api/emails/templates` | Get email templates |
| POST | `/api/emails/templates` | Create email template |
| PUT | `/api/emails/templates/{id}` | Update template |
| DELETE | `/api/emails/templates/{id}` | Delete template |

### 5.8 Notes & Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes |
| GET | `/api/notes/{id}` | Get note by ID |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents/{id}` | Download document |
| DELETE | `/api/documents/{id}` | Delete document |

### 5.9 Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Get dashboard data |
| GET | `/api/reports/sales` | Get sales reports |
| GET | `/api/reports/leads` | Get lead analytics |
| GET | `/api/reports/activities` | Get activity reports |
| GET | `/api/reports/pipeline` | Get pipeline analytics |
| GET | `/api/reports/export` | Export report to PDF/Excel |

### 5.10 Users & Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (Admin) |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create user (Admin) |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user (Admin) |
| PUT | `/api/users/{id}/role` | Update user role |
| GET | `/api/settings` | Get system settings |
| PUT | `/api/settings` | Update settings |

---

## 6. Frontend Architecture

### 6.1 Angular Project Structure

```
src/
├── app/
│   ├── core/                     # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── api.service.ts
│   │   │   └── storage.service.ts
│   │   └── core.module.ts
│   │
│   ├── shared/                   # Shared components, directives, pipes
│   │   ├── components/
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   ├── data-table/
│   │   │   ├── modal/
│   │   │   ├── confirm-dialog/
│   │   │   ├── loading-spinner/
│   │   │   └── toast/
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── shared.module.ts
│   │
│   ├── features/                 # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── stats-card/
│   │   │   │   ├── sales-chart/
│   │   │   │   ├── pipeline-chart/
│   │   │   │   └── activity-feed/
│   │   │   ├── dashboard.component.ts
│   │   │   └── dashboard.routes.ts
│   │   │
│   │   ├── contacts/
│   │   │   ├── contact-list/
│   │   │   ├── contact-detail/
│   │   │   ├── contact-form/
│   │   │   ├── services/
│   │   │   └── contacts.routes.ts
│   │   │
│   │   ├── leads/
│   │   │   ├── lead-list/
│   │   │   ├── lead-detail/
│   │   │   ├── lead-form/
│   │   │   ├── lead-convert/
│   │   │   ├── services/
│   │   │   └── leads.routes.ts
│   │   │
│   │   ├── deals/
│   │   │   ├── deal-list/
│   │   │   ├── deal-detail/
│   │   │   ├── deal-form/
│   │   │   ├── pipeline-board/
│   │   │   ├── services/
│   │   │   └── deals.routes.ts
│   │   │
│   │   ├── tasks/
│   │   │   ├── task-list/
│   │   │   ├── task-detail/
│   │   │   ├── task-form/
│   │   │   ├── services/
│   │   │   └── tasks.routes.ts
│   │   │
│   │   ├── calendar/
│   │   │   ├── calendar-view/
│   │   │   ├── event-form/
│   │   │   ├── services/
│   │   │   └── calendar.routes.ts
│   │   │
│   │   ├── emails/
│   │   │   ├── email-list/
│   │   │   ├── email-compose/
│   │   │   ├── email-templates/
│   │   │   ├── services/
│   │   │   └── emails.routes.ts
│   │   │
│   │   ├── notes/
│   │   │   ├── note-list/
│   │   │   ├── note-editor/
│   │   │   ├── services/
│   │   │   └── notes.routes.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── sales-report/
│   │   │   ├── lead-report/
│   │   │   ├── activity-report/
│   │   │   ├── services/
│   │   │   └── reports.routes.ts
│   │   │
│   │   └── settings/
│   │       ├── profile/
│   │       ├── users/
│   │       ├── system/
│   │       └── settings.routes.ts
│   │
│   ├── layouts/
│   │   ├── main-layout/
│   │   └── auth-layout/
│   │
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
│
├── assets/
│   ├── images/
│   └── icons/
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── styles/
    ├── _variables.scss
    ├── _themes.scss
    └── styles.scss
```

### 6.2 Theme System

```typescript
// Theme Configuration
interface Theme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// Light Theme
const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#3B82F6',      // Blue
    secondary: '#6366F1',    // Indigo
    background: '#F9FAFB',   // Gray-50
    surface: '#FFFFFF',      // White
    text: '#111827',         // Gray-900
    textSecondary: '#6B7280', // Gray-500
    border: '#E5E7EB',       // Gray-200
    success: '#10B981',      // Emerald
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
    info: '#06B6D4',         // Cyan
  }
};

// Dark Theme
const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#60A5FA',      // Blue-400
    secondary: '#818CF8',    // Indigo-400
    background: '#111827',   // Gray-900
    surface: '#1F2937',      // Gray-800
    text: '#F9FAFB',         // Gray-50
    textSecondary: '#9CA3AF', // Gray-400
    border: '#374151',       // Gray-700
    success: '#34D399',      // Emerald-400
    warning: '#FBBF24',      // Amber-400
    error: '#F87171',        // Red-400
    info: '#22D3EE',         // Cyan-400
  }
};
```

---

## 7. Backend Architecture

### 7.1 .NET Project Structure (Clean Architecture)

```
CRM.Solution/
├── src/
│   ├── CRM.API/                      # Presentation Layer
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── ContactsController.cs
│   │   │   ├── LeadsController.cs
│   │   │   ├── DealsController.cs
│   │   │   ├── TasksController.cs
│   │   │   ├── EventsController.cs
│   │   │   ├── EmailsController.cs
│   │   │   ├── NotesController.cs
│   │   │   ├── DocumentsController.cs
│   │   │   ├── ReportsController.cs
│   │   │   ├── UsersController.cs
│   │   │   └── SettingsController.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionMiddleware.cs
│   │   │   └── RequestLoggingMiddleware.cs
│   │   ├── Filters/
│   │   │   └── ValidationFilter.cs
│   │   ├── Extensions/
│   │   │   └── ServiceExtensions.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   ├── CRM.Application/              # Application Layer
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   ├── Mappings/
│   │   │   ├── Behaviors/
│   │   │   └── Exceptions/
│   │   ├── Features/
│   │   │   ├── Auth/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   └── DTOs/
│   │   │   ├── Contacts/
│   │   │   ├── Leads/
│   │   │   ├── Deals/
│   │   │   ├── Tasks/
│   │   │   ├── Events/
│   │   │   ├── Emails/
│   │   │   ├── Notes/
│   │   │   ├── Documents/
│   │   │   ├── Reports/
│   │   │   └── Users/
│   │   └── DependencyInjection.cs
│   │
│   ├── CRM.Domain/                   # Domain Layer
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Role.cs
│   │   │   ├── Contact.cs
│   │   │   ├── Lead.cs
│   │   │   ├── Deal.cs
│   │   │   ├── DealStage.cs
│   │   │   ├── Task.cs
│   │   │   ├── Event.cs
│   │   │   ├── Email.cs
│   │   │   ├── EmailTemplate.cs
│   │   │   ├── Note.cs
│   │   │   ├── Document.cs
│   │   │   └── AuditLog.cs
│   │   ├── Enums/
│   │   │   ├── ContactCategory.cs
│   │   │   ├── LeadStatus.cs
│   │   │   ├── LeadSource.cs
│   │   │   ├── DealStatus.cs
│   │   │   ├── TaskPriority.cs
│   │   │   ├── TaskStatus.cs
│   │   │   └── TaskType.cs
│   │   ├── Common/
│   │   │   ├── BaseEntity.cs
│   │   │   └── AuditableEntity.cs
│   │   └── Events/
│   │
│   └── CRM.Infrastructure/           # Infrastructure Layer
│       ├── Data/
│       │   ├── ApplicationDbContext.cs
│       │   ├── Configurations/
│       │   │   ├── UserConfiguration.cs
│       │   │   ├── ContactConfiguration.cs
│       │   │   └── ...
│       │   └── Migrations/
│       ├── Repositories/
│       │   ├── GenericRepository.cs
│       │   ├── ContactRepository.cs
│       │   └── ...
│       ├── Services/
│       │   ├── AuthService.cs
│       │   ├── TokenService.cs
│       │   ├── EmailService.cs
│       │   └── FileStorageService.cs
│       └── DependencyInjection.cs
│
└── tests/
    ├── CRM.API.Tests/
    ├── CRM.Application.Tests/
    └── CRM.Infrastructure.Tests/
```

---

## 8. Security Requirements

### 8.1 Authentication
- JWT Bearer token authentication
- Refresh token rotation
- Token expiration: Access (15 min), Refresh (7 days)
- Secure password hashing (BCrypt)
- Account lockout after failed attempts

### 8.2 Authorization
- Role-based access control (RBAC)
- Policy-based authorization
- Resource-based authorization for owned records
- API endpoint protection

### 8.3 Data Protection
- HTTPS enforcement
- CORS configuration
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF tokens
- Input validation and sanitization
- Sensitive data encryption

### 8.4 Audit Logging
- User activity logging
- Login/logout tracking
- Data modification history
- IP address logging

---

## 9. UI/UX Requirements

### 9.1 Design Principles
- Modern, clean, professional appearance
- Consistent spacing and typography
- Intuitive navigation
- Responsive design (desktop, tablet, mobile)
- Accessibility compliance (WCAG 2.1)

### 9.2 Key UI Components
- Collapsible sidebar navigation
- Breadcrumb navigation
- Data tables with sorting, filtering, pagination
- Modal dialogs for forms
- Toast notifications
- Loading states and skeletons
- Empty states with guidance
- Error states with recovery actions

### 9.3 Dashboard Layout
```
┌────────────────────────────────────────────────────────────┐
│  Header (Logo, Search, Notifications, User Menu, Theme)    │
├──────────┬─────────────────────────────────────────────────┤
│          │                                                  │
│          │  ┌─────────────────────────────────────────────┐ │
│          │  │  KPI Cards Row                              │ │
│          │  └─────────────────────────────────────────────┘ │
│          │                                                  │
│ Sidebar  │  ┌──────────────────┐ ┌──────────────────────┐  │
│          │  │                  │ │                      │  │
│ - Dash   │  │  Sales Chart     │ │  Pipeline Funnel     │  │
│ - Contacts│ │                  │ │                      │  │
│ - Leads  │  └──────────────────┘ └──────────────────────┘  │
│ - Deals  │                                                  │
│ - Tasks  │  ┌──────────────────┐ ┌──────────────────────┐  │
│ - Calendar│ │                  │ │                      │  │
│ - Email  │  │  Recent Activity │ │  Upcoming Tasks      │  │
│ - Notes  │  │                  │ │                      │  │
│ - Reports│  └──────────────────┘ └──────────────────────┘  │
│ - Settings│                                                 │
│          │                                                  │
└──────────┴─────────────────────────────────────────────────┘
```

---

## 10. Non-Functional Requirements

### 10.1 Performance
- Page load time < 3 seconds
- API response time < 500ms
- Support 100+ concurrent users
- Database query optimization

### 10.2 Scalability
- Horizontal scaling capability
- Caching strategy (Redis-ready)
- Database connection pooling

### 10.3 Reliability
- 99.9% uptime target
- Graceful error handling
- Data backup strategy
- Disaster recovery plan

### 10.4 Maintainability
- Clean code principles
- Comprehensive documentation
- Unit test coverage > 80%
- CI/CD pipeline ready

---

## 11. Deployment Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐     │     ┌────────▼────────┐
     │  Angular App    │     │     │  Angular App    │
     │  (CDN/Static)   │     │     │  (CDN/Static)   │
     └─────────────────┘     │     └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐     │     ┌────────▼────────┐
     │  .NET API       │     │     │  .NET API       │
     │  Instance 1     │     │     │  Instance 2     │
     └────────┬────────┘     │     └────────┬────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │   MySQL 8.0     │
                    │   (Primary)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   MySQL 8.0     │
                    │   (Replica)     │
                    └─────────────────┘
```

---

## 12. Appendix

### 12.1 Glossary
- **CRM**: Customer Relationship Management
- **Lead**: A potential customer who has shown interest
- **Deal**: A sales opportunity being pursued
- **Pipeline**: Visual representation of deals across stages
- **RBAC**: Role-Based Access Control
- **JWT**: JSON Web Token

### 12.2 References
- Angular 17 Documentation
- .NET 8 Documentation
- MySQL 8.0 Documentation
- Entity Framework Core Documentation
- Tailwind CSS Documentation

---

**Document Version**: 1.0
**Created**: 2026-02-18
**Author**: MiniMax Agent
