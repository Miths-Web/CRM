/*
=======================================================
 DHWITI CRM — Role Permission Matrix
=======================================================

ROLES:
  Admin         → Full access — everything
  Manager       → Team oversight, reports, can delete
  Sales Rep     → Own data + team data, can create/edit
  Support Agent → Contacts, tasks, live chat only
  Viewer        → Read-only access everywhere

=======================================================
ENDPOINT               Admin  Manager  SalesRep  Support  Viewer
=======================================================
Auth (login/register)  ✅     ✅       ✅         ✅       ✅
─────────────────────────────────────────────────────────
Dashboard              ✅     ✅       ✅         ❌       ❌
Sales Report           ✅     ✅       ❌         ❌       ❌
Leads Report           ✅     ✅       ✅         ❌       ❌
─────────────────────────────────────────────────────────
Contacts (read)        ✅     ✅       ✅         ✅       ✅
Contacts (write)       ✅     ✅       ✅         ✅       ❌
Contacts (delete)      ✅     ✅       ❌         ❌       ❌
─────────────────────────────────────────────────────────
Leads (read)           ✅     ✅       ✅         ❌       ✅
Leads (write)          ✅     ✅       ✅         ❌       ❌
Leads (delete)         ✅     ✅       ❌         ❌       ❌
Leads (convert)        ✅     ✅       ✅         ❌       ❌
─────────────────────────────────────────────────────────
Deals (read)           ✅     ✅       ✅         ❌       ✅
Deals (write)          ✅     ✅       ✅         ❌       ❌
Deals (delete)         ✅     ✅       ❌         ❌       ❌
─────────────────────────────────────────────────────────
Tasks (all)            ✅     ✅       ✅         ✅       ✅
─────────────────────────────────────────────────────────
Events (all)           ✅     ✅       ✅         ✅       ✅
─────────────────────────────────────────────────────────
Emails (all)           ✅     ✅       ✅         ✅       ❌
─────────────────────────────────────────────────────────
Notes (all)            ✅     ✅       ✅         ✅       ✅
Documents (all)        ✅     ✅       ✅         ✅       ✅
─────────────────────────────────────────────────────────
Team Chat (all)        ✅     ✅       ✅         ✅       ✅
Live Chat Sessions     ✅     ✅       ✅         ✅       ❌
Meetings (all)         ✅     ✅       ✅         ❌       ✅
─────────────────────────────────────────────────────────
Search (all)           ✅     ✅       ✅         ✅       ✅
Import/Export          ✅     ✅       ❌         ❌       ❌
─────────────────────────────────────────────────────────
Users (read)           ✅     ✅       ❌         ❌       ❌
Users (write/roles)    ✅     ❌       ❌         ❌       ❌
Settings               ✅     ❌       ❌         ❌       ❌
Hangfire Dashboard     ✅     ❌       ❌         ❌       ❌
=======================================================
*/
