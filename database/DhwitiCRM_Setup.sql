-- ============================================================
--  DhwitiCRM — Complete Database Setup (v2.0)
--  Microsoft SQL Server 2019/2022 | SQL Server Express
--  Run this ONE FILE in SSMS to setup everything from scratch
--
--  FLOW: Lead → Qualification → Deal → Product Selection
--        → Order → Invoice → Payment
--
--  Tables:
--    1.  Roles, Users, UserRoles
--    2.  CompanyMaster
--    3.  CustomerMaster
--    4.  CustomerAddresses
--    5.  Leads
--    6.  DealStages, Deals
--    7.  Products
--    8.  Orders, OrderItems
--    9.  Invoices
--    10. Payments
--    11. Tasks, Events
--    12. Emails, EmailTemplates
--    13. Notes, Documents
--    14. ChatMessages
--    15. MeetingRooms
--    16. LiveChatSessions, LiveChatMessages
--    17. AuditLogs, Settings
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DhwitiCRM')
BEGIN
    CREATE DATABASE DhwitiCRM
    COLLATE SQL_Latin1_General_CP1_CI_AS;
    PRINT 'Database DhwitiCRM created.';
END
ELSE
    PRINT 'Database DhwitiCRM already exists.';
GO

USE DhwitiCRM;
GO

-- ============================================================
-- 1. ROLES & USERS
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Roles' AND xtype='U')
CREATE TABLE Roles (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Name        NVARCHAR(50)     NOT NULL UNIQUE,
    Description NVARCHAR(255)    NULL,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    Id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    FirstName           NVARCHAR(50)     NOT NULL,
    LastName            NVARCHAR(50)     NOT NULL,
    Email               NVARCHAR(100)    NOT NULL UNIQUE,
    PasswordHash        NVARCHAR(255)    NOT NULL,
    Phone               NVARCHAR(20)     NULL,
    Department          NVARCHAR(100)    NULL,
    JobTitle            NVARCHAR(100)    NULL,
    AvatarUrl           NVARCHAR(500)    NULL,
    IsActive            BIT              NOT NULL DEFAULT 1,
    LastLogin           DATETIME2        NULL,
    RefreshToken        NVARCHAR(500)    NULL,
    RefreshTokenExpiry  DATETIME2        NULL,
    -- BUG-018 FIX: Account lockout columns — C# entity mein the, SQL script mein missing the
    FailedLoginAttempts INT              NOT NULL DEFAULT 0,
    LockoutEnd          DATETIME2        NULL,
    CreatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX idx_users_email  ON Users (Email);
CREATE INDEX idx_users_active ON Users (IsActive);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserRoles' AND xtype='U')
CREATE TABLE UserRoles (
    UserId UNIQUEIDENTIFIER NOT NULL,
    RoleId UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId),
    CONSTRAINT FK_UserRoles_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_UserRoles_Role FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE
);
GO

-- ============================================================
-- 2. COMPANY MASTER (B2B - Jis company ko product bechna hai)
--    Purpose: Ek company ki legal/official identity.
--             Invoice, GST, PAN sab yahan.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CompanyMaster' AND xtype='U')
CREATE TABLE CompanyMaster (
    CompanyId      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    CompanyName    NVARCHAR(200)    NOT NULL,
    CompanyAddress NVARCHAR(MAX)    NULL,              -- Head Office Address
    OwnerFirstName NVARCHAR(100)    NULL,
    OwnerLastName  NVARCHAR(100)    NULL,
    Email          NVARCHAR(255)    NULL,
    PhoneNo        NVARCHAR(50)     NULL,
    Website        NVARCHAR(255)    NULL,              -- Company ki website
    GSTNo          NVARCHAR(20)     NULL,              -- GST (Invoice ke liye zaruri)
    PANNo          NVARCHAR(20)     NULL,              -- Company PAN
    IndustryType   NVARCHAR(100)    NULL,              -- IT, Manufacturing, Retail etc.
    LogoUrl        NVARCHAR(MAX)    NULL,
    IsDelete       BIT              NOT NULL DEFAULT 0,
    CreatedDate    DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      UNIQUEIDENTIFIER NULL,
    UpdatedDate    DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy      UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Company_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Company_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_company_name ON CompanyMaster (CompanyName);
GO

-- ============================================================
-- 3. CUSTOMER MASTER (Individual Log - Company ke andar kaun h
--             Ek company mein kai customers ho sakte hain.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomerMaster' AND xtype='U')
CREATE TABLE CustomerMaster (
    CustomerId    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    CompanyId     UNIQUEIDENTIFIER NOT NULL,           -- Kaunsi company ka banda hai
    FirstName     NVARCHAR(100)    NOT NULL,
    LastName      NVARCHAR(100)    NULL,
    Email         NVARCHAR(255)    NULL,
    PhoneNo       NVARCHAR(50)     NULL,
    Designation   NVARCHAR(100)    NULL,               -- Manager, Director, Purchase Head etc.
    AdharCardNo   NVARCHAR(20)     NULL,               -- Identity proof
    PANNo         NVARCHAR(20)     NULL,               -- Personal PAN (if needed)
    AssignedToUserId UNIQUEIDENTIFIER NULL,            -- Kaun handle kar raha hai
    IsDelete      BIT              NOT NULL DEFAULT 0,
    CreatedDate   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy     UNIQUEIDENTIFIER NULL,
    UpdatedDate   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy     UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Customer_Company   FOREIGN KEY (CompanyId)        REFERENCES CompanyMaster(CompanyId) ON DELETE NO ACTION,
    CONSTRAINT FK_Customer_Assigned  FOREIGN KEY (AssignedToUserId)  REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Customer_CreatedBy FOREIGN KEY (CreatedBy)         REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Customer_UpdatedBy FOREIGN KEY (UpdatedBy)         REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_customer_company  ON CustomerMaster (CompanyId);
CREATE INDEX idx_customer_assigned ON CustomerMaster (AssignedToUserId);
GO

-- ============================================================
-- 4. CUSTOMER ADDRESSES (Billing + Shipping ek hi table mein)
--    Purpose: Ek customer ke kai addresses ho sakte hain.
--             AddressType = 'BILLING' ya 'SHIPPING'
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomerAddresses' AND xtype='U')
CREATE TABLE CustomerAddresses (
    AddressId    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    CustomerId   UNIQUEIDENTIFIER NOT NULL,
    AddressType  NVARCHAR(50)     NOT NULL              -- 'BILLING' ya 'SHIPPING'
                     CHECK (AddressType IN ('BILLING', 'SHIPPING', 'OFFICE', 'OTHER')),
    AddressLine1 NVARCHAR(MAX)    NOT NULL,
    AddressLine2 NVARCHAR(MAX)    NULL,
    City         NVARCHAR(100)    NULL,
    State        NVARCHAR(100)    NULL,
    Pincode      NVARCHAR(20)     NULL,
    Country      NVARCHAR(100)    NOT NULL DEFAULT 'India',
    IsDefault    BIT              NOT NULL DEFAULT 0,   -- Main address hai kya?
    IsDelete     BIT              NOT NULL DEFAULT 0,
    CreatedDate  DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy    UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Address_Customer  FOREIGN KEY (CustomerId) REFERENCES CustomerMaster(CustomerId) ON DELETE CASCADE,
    CONSTRAINT FK_Address_CreatedBy FOREIGN KEY (CreatedBy)  REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_address_customer ON CustomerAddresses (CustomerId);
CREATE INDEX idx_address_type     ON CustomerAddresses (AddressType);
GO

-- ============================================================
-- 5. LEADS (Naya Enquiry - Abhi customer nahi bana)
--    Purpose: Pehla step. Jab qualify ho tab Deal + Customer banega.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Leads' AND xtype='U')
CREATE TABLE Leads (
    Id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Title                 NVARCHAR(255)    NOT NULL,
    FirstName             NVARCHAR(100)    NULL,
    LastName              NVARCHAR(100)    NULL,
    Email                 NVARCHAR(255)    NULL,
    Phone                 NVARCHAR(50)     NULL,
    Company               NVARCHAR(255)    NULL,
    JobTitle              NVARCHAR(100)    NULL,
    Status                NVARCHAR(50)     NOT NULL DEFAULT 'New'
                              CHECK (Status IN ('New','Contacted','Qualified','Unqualified','Converted','Lost')),
    Source                NVARCHAR(50)     NULL
                              CHECK (Source IN ('Website','Referral','Social','Advertisement','Cold_Call','Event','Other')),
    Score                 INT              NOT NULL DEFAULT 0,
    EstimatedValue        DECIMAL(18,2)    NULL,
    Description           NVARCHAR(MAX)    NULL,
    AssignedToUserId      UNIQUEIDENTIFIER NULL,
    -- Jab Lead qualify ho kar Customer ban jaye
    ConvertedToCustomerId UNIQUEIDENTIFIER NULL,
    ConvertedToCompanyId  UNIQUEIDENTIFIER NULL,
    ConvertedToDealId     UNIQUEIDENTIFIER NULL,
    ConvertedAt           DATETIME2        NULL,
    CreatedAt             DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt             DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId       UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Leads_Assigned FOREIGN KEY (AssignedToUserId)     REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Leads_Creator  FOREIGN KEY (CreatedByUserId)       REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Leads_Customer FOREIGN KEY (ConvertedToCustomerId) REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Leads_Company  FOREIGN KEY (ConvertedToCompanyId)  REFERENCES CompanyMaster(CompanyId)  ON DELETE NO ACTION
);
GO

CREATE INDEX idx_leads_status   ON Leads (Status);
CREATE INDEX idx_leads_assigned ON Leads (AssignedToUserId);
CREATE INDEX idx_leads_email    ON Leads (Email);
GO

-- ============================================================
-- 6. DEAL STAGES & DEALS (Opportunity - Baat pakki ho rahi hai)
--    Purpose: Lead qualify hone ke baad Deal khulta hai.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DealStages' AND xtype='U')
CREATE TABLE DealStages (
    Id          INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL,
    OrderIndex  INT           NOT NULL,
    Probability INT           NOT NULL DEFAULT 0,
    IsActive    BIT           NOT NULL DEFAULT 1
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Deals' AND xtype='U')
CREATE TABLE Deals (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Title             NVARCHAR(255)    NOT NULL,
    Value             DECIMAL(18,2)    NOT NULL DEFAULT 0,
    Currency          NVARCHAR(10)     NOT NULL DEFAULT 'INR',
    StageId           INT              NULL,
    Probability       INT              NOT NULL DEFAULT 0,
    ExpectedCloseDate DATE             NULL,
    ActualCloseDate   DATE             NULL,
    Status            NVARCHAR(50)     NOT NULL DEFAULT 'Open'
                          CHECK (Status IN ('Open','Won','Lost','OnHold')),
    LostReason        NVARCHAR(MAX)    NULL,
    -- Contacts ki jagah Customer aur Company link hoga
    CustomerId        UNIQUEIDENTIFIER NULL,
    CompanyId         UNIQUEIDENTIFIER NULL,
    Description       NVARCHAR(MAX)    NULL,
    AssignedToUserId  UNIQUEIDENTIFIER NULL,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId   UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Deals_Stage    FOREIGN KEY (StageId)          REFERENCES DealStages(Id)          ON DELETE NO ACTION,
    CONSTRAINT FK_Deals_Customer FOREIGN KEY (CustomerId)        REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Deals_Company  FOREIGN KEY (CompanyId)         REFERENCES CompanyMaster(CompanyId)   ON DELETE NO ACTION,
    CONSTRAINT FK_Deals_Assigned FOREIGN KEY (AssignedToUserId)  REFERENCES Users(Id)              ON DELETE NO ACTION,
    CONSTRAINT FK_Deals_Creator  FOREIGN KEY (CreatedByUserId)   REFERENCES Users(Id)              ON DELETE NO ACTION
);
GO

-- Add deal FK to Leads (now that Deals table exists)
ALTER TABLE Leads
    ADD CONSTRAINT FK_Leads_Deal
    FOREIGN KEY (ConvertedToDealId) REFERENCES Deals(Id) ON DELETE NO ACTION;
GO

CREATE INDEX idx_deals_status   ON Deals (Status);
CREATE INDEX idx_deals_stage    ON Deals (StageId);
CREATE INDEX idx_deals_assigned ON Deals (AssignedToUserId);
GO

-- ============================================================
-- 7. PRODUCTS (Kya Bechna Hai)
--    Purpose: Aapke products/services ki master list.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
CREATE TABLE Products (
    ProductId       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProductName     NVARCHAR(255)    NOT NULL,
    SKU             NVARCHAR(100)    NULL UNIQUE,       -- Product Code
    Category        NVARCHAR(100)    NULL,              -- Hardware, Software, Service etc.
    Description     NVARCHAR(MAX)    NULL,
    UnitPrice       DECIMAL(18,2)    NOT NULL DEFAULT 0, -- Asli keemat
    TaxRate         DECIMAL(5,2)     NOT NULL DEFAULT 18.00, -- GST % (Default 18%)
    Unit            NVARCHAR(50)     NULL,              -- Piece, KG, Litre, Hours etc.
    StockQuantity   INT              NOT NULL DEFAULT 0,
    IsActive        BIT              NOT NULL DEFAULT 1,
    IsDelete        BIT              NOT NULL DEFAULT 0,
    CreatedDate     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy       UNIQUEIDENTIFIER NULL,
    UpdatedDate     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy       UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Product_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Product_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_product_sku      ON Products (SKU);
CREATE INDEX idx_product_category ON Products (Category);
GO

-- ============================================================
-- 8. ORDERS & ORDER ITEMS (Pukka Order - Deal se bana)
--    Purpose: Jab Deal "Won" ho jaye, tab Order create hota hai.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderMaster' AND xtype='U')
CREATE TABLE OrderMaster (
    OrderId          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    OrderNumber      NVARCHAR(50)     NOT NULL UNIQUE,  -- e.g. ORD-2024-0001
    DealId           UNIQUEIDENTIFIER NULL,             -- Kaunsi deal se bana
    CustomerId       UNIQUEIDENTIFIER NOT NULL,
    CompanyId        UNIQUEIDENTIFIER NOT NULL,
    OrderDate        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    ExpectedDelivery DATE             NULL,
    Status           NVARCHAR(50)     NOT NULL DEFAULT 'Pending'
                         CHECK (Status IN ('Pending','Confirmed','Processing','Dispatched','Delivered','Cancelled')),
    SubTotal         DECIMAL(18,2)    NOT NULL DEFAULT 0, -- Before tax
    TaxAmount        DECIMAL(18,2)    NOT NULL DEFAULT 0,
    DiscountAmount   DECIMAL(18,2)    NOT NULL DEFAULT 0,
    TotalAmount      DECIMAL(18,2)    NOT NULL DEFAULT 0, -- Final amount
    Notes            NVARCHAR(MAX)    NULL,
    IsDelete         BIT              NOT NULL DEFAULT 0,
    CreatedDate      DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy        UNIQUEIDENTIFIER NULL,
    UpdatedDate      DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy        UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Order_Deal      FOREIGN KEY (DealId)     REFERENCES Deals(Id)                ON DELETE NO ACTION,
    CONSTRAINT FK_Order_Customer  FOREIGN KEY (CustomerId)  REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Order_Company   FOREIGN KEY (CompanyId)   REFERENCES CompanyMaster(CompanyId)   ON DELETE NO ACTION,
    CONSTRAINT FK_Order_CreatedBy FOREIGN KEY (CreatedBy)   REFERENCES Users(Id)               ON DELETE NO ACTION,
    CONSTRAINT FK_Order_UpdatedBy FOREIGN KEY (UpdatedBy)   REFERENCES Users(Id)               ON DELETE NO ACTION
);
GO

CREATE INDEX idx_order_number   ON OrderMaster (OrderNumber);
CREATE INDEX idx_order_status   ON OrderMaster (Status);
CREATE INDEX idx_order_customer ON OrderMaster (CustomerId);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderItems' AND xtype='U')
CREATE TABLE OrderItems (
    OrderItemId  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    OrderId      UNIQUEIDENTIFIER NOT NULL,
    ProductId    UNIQUEIDENTIFIER NOT NULL,
    Quantity     DECIMAL(10,2)    NOT NULL DEFAULT 1,
    UnitPrice    DECIMAL(18,2)    NOT NULL,            -- Order ke time ka rate
    DiscountPct  DECIMAL(5,2)     NOT NULL DEFAULT 0,  -- Discount %
    TaxRate      DECIMAL(5,2)     NOT NULL DEFAULT 18, -- GST %
    LineTotal    DECIMAL(18,2)    NOT NULL,            -- Final line amount
    CONSTRAINT FK_OrderItem_Order   FOREIGN KEY (OrderId)   REFERENCES OrderMaster(OrderId) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItem_Product FOREIGN KEY (ProductId) REFERENCES Products(ProductId)  ON DELETE NO ACTION
);
GO

CREATE INDEX idx_orderitem_order   ON OrderItems (OrderId);
CREATE INDEX idx_orderitem_product ON OrderItems (ProductId);
GO

-- ============================================================
-- 9. INVOICES (Bill - Paisa maangna)
--    Purpose: Order ke baad official invoice nikala jata hai.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' AND xtype='U')
CREATE TABLE Invoices (
    InvoiceId       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    InvoiceNumber   NVARCHAR(50)     NOT NULL UNIQUE,  -- e.g. INV-2024-0001
    OrderId         UNIQUEIDENTIFIER NOT NULL,
    CustomerId      UNIQUEIDENTIFIER NOT NULL,
    CompanyId       UNIQUEIDENTIFIER NOT NULL,
    BillingAddressId UNIQUEIDENTIFIER NULL,            -- Customer ka billing address
    InvoiceDate     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    DueDate         DATE             NOT NULL,         -- Kab tak paisa dena hai
    SubTotal        DECIMAL(18,2)    NOT NULL DEFAULT 0,
    TaxAmount       DECIMAL(18,2)    NOT NULL DEFAULT 0,
    DiscountAmount  DECIMAL(18,2)    NOT NULL DEFAULT 0,
    TotalAmount     DECIMAL(18,2)    NOT NULL DEFAULT 0,
    PaidAmount      DECIMAL(18,2)    NOT NULL DEFAULT 0,
    DueAmount       AS (TotalAmount - PaidAmount),     -- Computed: Bacha hua paisa
    PaymentStatus   NVARCHAR(50)     NOT NULL DEFAULT 'Unpaid'
                        CHECK (PaymentStatus IN ('Unpaid','PartiallyPaid','Paid','Overdue','Cancelled')),
    Notes           NVARCHAR(MAX)    NULL,
    TermsConditions NVARCHAR(MAX)    NULL,
    IsDelete        BIT              NOT NULL DEFAULT 0,
    CreatedDate     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy       UNIQUEIDENTIFIER NULL,
    UpdatedDate     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy       UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Invoice_Order      FOREIGN KEY (OrderId)          REFERENCES OrderMaster(OrderId)       ON DELETE NO ACTION,
    CONSTRAINT FK_Invoice_Customer   FOREIGN KEY (CustomerId)        REFERENCES CustomerMaster(CustomerId)  ON DELETE NO ACTION,
    CONSTRAINT FK_Invoice_Company    FOREIGN KEY (CompanyId)         REFERENCES CompanyMaster(CompanyId)    ON DELETE NO ACTION,
    CONSTRAINT FK_Invoice_Address    FOREIGN KEY (BillingAddressId)  REFERENCES CustomerAddresses(AddressId) ON DELETE NO ACTION,
    CONSTRAINT FK_Invoice_CreatedBy  FOREIGN KEY (CreatedBy)         REFERENCES Users(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Invoice_UpdatedBy  FOREIGN KEY (UpdatedBy)         REFERENCES Users(Id)                  ON DELETE NO ACTION
);
GO

CREATE INDEX idx_invoice_number  ON Invoices (InvoiceNumber);
CREATE INDEX idx_invoice_status  ON Invoices (PaymentStatus);
CREATE INDEX idx_invoice_customer ON Invoices (CustomerId);
GO

-- ============================================================
-- 10. PAYMENTS (Paisa aaya - Actual payment record)
--     Purpose: Ek invoice ke against kai partial payments ho sakte hain.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payments' AND xtype='U')
CREATE TABLE Payments (
    PaymentId      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    InvoiceId      UNIQUEIDENTIFIER NOT NULL,
    PaymentDate    DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    Amount         DECIMAL(18,2)    NOT NULL,
    PaymentMode    NVARCHAR(50)     NOT NULL
                       CHECK (PaymentMode IN ('Cash','Cheque','Online','UPI','NEFT','RTGS','Card','Other')),
    TransactionRef NVARCHAR(255)    NULL,               -- Bank reference / UTR Number
    Remarks        NVARCHAR(MAX)    NULL,
    ReceivedBy     UNIQUEIDENTIFIER NULL,              -- Kaun sa user ne receive kiya
    IsDelete       BIT              NOT NULL DEFAULT 0,
    CreatedDate    DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Payment_Invoice   FOREIGN KEY (InvoiceId)   REFERENCES Invoices(InvoiceId) ON DELETE NO ACTION,
    CONSTRAINT FK_Payment_Received  FOREIGN KEY (ReceivedBy)  REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Payment_CreatedBy FOREIGN KEY (CreatedBy)   REFERENCES Users(Id)           ON DELETE NO ACTION
);
GO

CREATE INDEX idx_payment_invoice ON Payments (InvoiceId);
CREATE INDEX idx_payment_date    ON Payments (PaymentDate);
GO

-- ============================================================
-- 11. TASKS (Kaam ki list)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' AND xtype='U')
CREATE TABLE Tasks (
    Id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Title            NVARCHAR(255)    NOT NULL,
    Description      NVARCHAR(MAX)    NULL,
    Type             NVARCHAR(50)     NULL CHECK (Type IN ('Call','Meeting','Email','Follow_Up','Demo','Other')),
    Priority         NVARCHAR(50)     NOT NULL DEFAULT 'Medium'
                         CHECK (Priority IN ('Low','Medium','High','Urgent')),
    Status           NVARCHAR(50)     NOT NULL DEFAULT 'Pending'
                         CHECK (Status IN ('Pending','InProgress','Completed','Cancelled')),
    DueDate          DATETIME2        NULL,
    IsCompleted      BIT              NOT NULL DEFAULT 0,
    CompletedAt      DATETIME2        NULL,
    AssignedToUserId UNIQUEIDENTIFIER NULL,
    CustomerId       UNIQUEIDENTIFIER NULL,   -- Customer se related task
    LeadId           UNIQUEIDENTIFIER NULL,   -- Lead se related task
    DealId           UNIQUEIDENTIFIER NULL,   -- Deal se related task
    CreatedAt        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId  UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Tasks_Assigned FOREIGN KEY (AssignedToUserId) REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Tasks_Creator  FOREIGN KEY (CreatedByUserId)  REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Tasks_Customer FOREIGN KEY (CustomerId)       REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Tasks_Lead     FOREIGN KEY (LeadId)           REFERENCES Leads(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Tasks_Deal     FOREIGN KEY (DealId)           REFERENCES Deals(Id)           ON DELETE NO ACTION
);
GO

CREATE INDEX idx_tasks_due      ON Tasks (DueDate);
CREATE INDEX idx_tasks_status   ON Tasks (Status);
CREATE INDEX idx_tasks_assigned ON Tasks (AssignedToUserId);
GO

-- ============================================================
-- 12. EVENTS / CALENDAR
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Events' AND xtype='U')
CREATE TABLE Events (
    Id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Title               NVARCHAR(255)    NOT NULL,
    Description         NVARCHAR(MAX)    NULL,
    Type                NVARCHAR(50)     NULL CHECK (Type IN ('Meeting','Call','Event','Reminder','Other')),
    StartDateTime       DATETIME2        NOT NULL,
    EndDateTime         DATETIME2        NOT NULL,
    IsAllDay            BIT              NOT NULL DEFAULT 0,
    Location            NVARCHAR(255)    NULL,
    Color               NVARCHAR(20)     NULL,
    ReminderMinutes     INT              NULL,
    AssignedToUserId    UNIQUEIDENTIFIER NULL,
    Attendees           NVARCHAR(MAX)    NULL,  -- JSON
    RelatedCustomerId   UNIQUEIDENTIFIER NULL,
    RelatedDealId       UNIQUEIDENTIFIER NULL,
    IsRecurring         BIT              NOT NULL DEFAULT 0,
    RecurrenceRule      NVARCHAR(255)    NULL,
    CreatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId     UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Events_Assigned FOREIGN KEY (AssignedToUserId)  REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Events_Creator  FOREIGN KEY (CreatedByUserId)   REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Events_Customer FOREIGN KEY (RelatedCustomerId) REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Events_Deal     FOREIGN KEY (RelatedDealId)     REFERENCES Deals(Id)           ON DELETE NO ACTION
);
GO

CREATE INDEX idx_events_start    ON Events (StartDateTime);
CREATE INDEX idx_events_assigned ON Events (AssignedToUserId);
GO

-- ============================================================
-- 13. EMAIL TEMPLATES & EMAILS
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmailTemplates' AND xtype='U')
CREATE TABLE EmailTemplates (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Name            NVARCHAR(255)    NOT NULL,
    Subject         NVARCHAR(255)    NOT NULL,
    Body            NVARCHAR(MAX)    NOT NULL,
    Category        NVARCHAR(100)    NULL,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_EmailTemplates_Creator FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Emails' AND xtype='U')
CREATE TABLE Emails (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Subject           NVARCHAR(255)    NOT NULL,
    Body              NVARCHAR(MAX)    NOT NULL,
    FromEmail         NVARCHAR(255)    NULL,
    ToEmail           NVARCHAR(255)    NOT NULL,
    CcEmails          NVARCHAR(MAX)    NULL,  -- JSON
    BccEmails         NVARCHAR(MAX)    NULL,  -- JSON
    Status            NVARCHAR(50)     NOT NULL DEFAULT 'Draft'
                          CHECK (Status IN ('Draft','Scheduled','Sent','Failed')),
    ScheduledAt       DATETIME2        NULL,
    SentAt            DATETIME2        NULL,
    OpenedAt          DATETIME2        NULL,
    ClickedAt         DATETIME2        NULL,
    TemplateId        UNIQUEIDENTIFIER NULL,
    RelatedCustomerId UNIQUEIDENTIFIER NULL,
    RelatedLeadId     UNIQUEIDENTIFIER NULL,
    RelatedDealId     UNIQUEIDENTIFIER NULL,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId   UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Emails_Template FOREIGN KEY (TemplateId)        REFERENCES EmailTemplates(Id)          ON DELETE NO ACTION,
    CONSTRAINT FK_Emails_Customer FOREIGN KEY (RelatedCustomerId) REFERENCES CustomerMaster(CustomerId)  ON DELETE NO ACTION,
    CONSTRAINT FK_Emails_Lead     FOREIGN KEY (RelatedLeadId)     REFERENCES Leads(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Emails_Deal     FOREIGN KEY (RelatedDealId)     REFERENCES Deals(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Emails_Creator  FOREIGN KEY (CreatedByUserId)   REFERENCES Users(Id)                  ON DELETE NO ACTION
);
GO

CREATE INDEX idx_emails_status   ON Emails (Status);
CREATE INDEX idx_emails_customer ON Emails (RelatedCustomerId);
GO

-- ============================================================
-- 14. NOTES & DOCUMENTS
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notes' AND xtype='U')
CREATE TABLE Notes (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Title             NVARCHAR(255)    NOT NULL,
    Content           NVARCHAR(MAX)    NOT NULL,
    Category          NVARCHAR(100)    NULL,
    IsPinned          BIT              NOT NULL DEFAULT 0,
    RelatedCustomerId UNIQUEIDENTIFIER NULL,
    RelatedLeadId     UNIQUEIDENTIFIER NULL,
    RelatedDealId     UNIQUEIDENTIFIER NULL,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId   UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Notes_Customer FOREIGN KEY (RelatedCustomerId) REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Notes_Lead     FOREIGN KEY (RelatedLeadId)     REFERENCES Leads(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Notes_Deal     FOREIGN KEY (RelatedDealId)     REFERENCES Deals(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Notes_Creator  FOREIGN KEY (CreatedByUserId)   REFERENCES Users(Id)                  ON DELETE NO ACTION
);
GO

CREATE INDEX idx_notes_pinned   ON Notes (IsPinned);
CREATE INDEX idx_notes_customer ON Notes (RelatedCustomerId);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Documents' AND xtype='U')
CREATE TABLE Documents (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    FileName          NVARCHAR(255)    NOT NULL,
    OriginalFileName  NVARCHAR(255)    NULL,
    FilePath          NVARCHAR(500)    NULL,
    FileSize          BIGINT           NULL,
    MimeType          NVARCHAR(100)    NULL,
    Category          NVARCHAR(100)    NULL,
    RelatedCustomerId UNIQUEIDENTIFIER NULL,
    RelatedLeadId     UNIQUEIDENTIFIER NULL,
    RelatedDealId     UNIQUEIDENTIFIER NULL,
    RelatedNoteId     UNIQUEIDENTIFIER NULL,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId   UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Docs_Customer FOREIGN KEY (RelatedCustomerId) REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Docs_Lead     FOREIGN KEY (RelatedLeadId)     REFERENCES Leads(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Docs_Deal     FOREIGN KEY (RelatedDealId)     REFERENCES Deals(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Docs_Note     FOREIGN KEY (RelatedNoteId)     REFERENCES Notes(Id)                  ON DELETE NO ACTION,
    CONSTRAINT FK_Docs_Creator  FOREIGN KEY (CreatedByUserId)   REFERENCES Users(Id)                  ON DELETE NO ACTION
);
GO

-- ============================================================
-- 15. INTERNAL TEAM CHAT
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatMessages' AND xtype='U')
CREATE TABLE ChatMessages (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    SenderId    UNIQUEIDENTIFIER NOT NULL,
    ReceiverId  UNIQUEIDENTIFIER NULL,
    RoomId      NVARCHAR(100)    NULL,
    Content     NVARCHAR(MAX)    NOT NULL,
    MessageType NVARCHAR(50)     NOT NULL DEFAULT 'Text',
    FileUrl     NVARCHAR(500)    NULL,
    IsRead      BIT              NOT NULL DEFAULT 0,
    ReadAt      DATETIME2        NULL,
    IsDeleted   BIT              NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Chat_Sender   FOREIGN KEY (SenderId)   REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Chat_Receiver FOREIGN KEY (ReceiverId) REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_chat_sender   ON ChatMessages (SenderId);
CREATE INDEX idx_chat_receiver ON ChatMessages (ReceiverId);
CREATE INDEX idx_chat_room     ON ChatMessages (RoomId);
GO

-- ============================================================
-- 16. VIDEO MEETINGS
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MeetingRooms' AND xtype='U')
CREATE TABLE MeetingRooms (
    Id                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Title              NVARCHAR(255)    NOT NULL,
    RoomCode           NVARCHAR(255)    NOT NULL UNIQUE,
    JitsiUrl           NVARCHAR(500)    NOT NULL,
    Password           NVARCHAR(100)    NULL,
    ScheduledAt        DATETIME2        NOT NULL,
    DurationMinutes    INT              NOT NULL DEFAULT 60,
    Status             NVARCHAR(50)     NOT NULL DEFAULT 'Scheduled',
    Description        NVARCHAR(MAX)    NULL,
    RecordingUrl       NVARCHAR(500)    NULL,
    HostUserId         UNIQUEIDENTIFIER NULL,
    RelatedCustomerId  UNIQUEIDENTIFIER NULL,
    RelatedDealId      UNIQUEIDENTIFIER NULL,
    CreatedAt          DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt          DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CreatedByUserId    UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Meeting_Host     FOREIGN KEY (HostUserId)        REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Meeting_Customer FOREIGN KEY (RelatedCustomerId) REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION,
    CONSTRAINT FK_Meeting_Deal     FOREIGN KEY (RelatedDealId)     REFERENCES Deals(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_Meeting_Creator  FOREIGN KEY (CreatedByUserId)   REFERENCES Users(Id)           ON DELETE NO ACTION
);
GO

-- ============================================================
-- 17. LIVE CLIENT CHAT WIDGET
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LiveChatSessions' AND xtype='U')
CREATE TABLE LiveChatSessions (
    Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    VisitorName       NVARCHAR(100)    NOT NULL DEFAULT 'Visitor',
    VisitorEmail      NVARCHAR(255)    NULL,
    VisitorPhone      NVARCHAR(50)     NULL,
    SessionToken      NVARCHAR(255)    NOT NULL UNIQUE,
    Status            NVARCHAR(50)     NOT NULL DEFAULT 'Waiting',
    Subject           NVARCHAR(255)    NULL,
    AssignedAgentId   UNIQUEIDENTIFIER NULL,
    AcceptedAt        DATETIME2        NULL,
    ClosedAt          DATETIME2        NULL,
    Rating            TINYINT          NOT NULL DEFAULT 0,
    RatingComment     NVARCHAR(MAX)    NULL,
    CreatedCustomerId UNIQUEIDENTIFIER NULL,  -- Agar visitor ka account bana
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_LiveSession_Agent    FOREIGN KEY (AssignedAgentId)  REFERENCES Users(Id)           ON DELETE NO ACTION,
    CONSTRAINT FK_LiveSession_Customer FOREIGN KEY (CreatedCustomerId) REFERENCES CustomerMaster(CustomerId) ON DELETE NO ACTION
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LiveChatMessages' AND xtype='U')
CREATE TABLE LiveChatMessages (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    SessionId   UNIQUEIDENTIFIER NOT NULL,
    SenderType  NVARCHAR(20)     NOT NULL DEFAULT 'Visitor',
    AgentId     UNIQUEIDENTIFIER NULL,
    Content     NVARCHAR(MAX)    NOT NULL,
    MessageType NVARCHAR(50)     NOT NULL DEFAULT 'Text',
    FileUrl     NVARCHAR(500)    NULL,
    IsRead      BIT              NOT NULL DEFAULT 0,
    SentAt      DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_LiveMsg_Session FOREIGN KEY (SessionId) REFERENCES LiveChatSessions(Id) ON DELETE CASCADE,
    CONSTRAINT FK_LiveMsg_Agent   FOREIGN KEY (AgentId)   REFERENCES Users(Id)            ON DELETE NO ACTION
);
GO

-- ============================================================
-- 18. SYSTEM TABLES
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLogs' AND xtype='U')
CREATE TABLE AuditLogs (
    Id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    UserId     UNIQUEIDENTIFIER NULL,
    Action     NVARCHAR(255)    NOT NULL,
    EntityName NVARCHAR(255)    NOT NULL,
    EntityId   UNIQUEIDENTIFIER NULL,
    Changes    NVARCHAR(MAX)    NULL,  -- JSON
    IpAddress  NVARCHAR(45)     NULL,
    CreatedAt  DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AuditLogs_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Settings' AND xtype='U')
CREATE TABLE Settings (
    Id              INT              NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SettingKey      NVARCHAR(255)    NOT NULL UNIQUE,
    SettingValue    NVARCHAR(MAX)    NULL,
    Description     NVARCHAR(255)    NULL,
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedByUserId UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_Settings_User FOREIGN KEY (UpdatedByUserId) REFERENCES Users(Id) ON DELETE NO ACTION
);
GO

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Admin')
INSERT INTO Roles (Id, Name, Description, CreatedAt, UpdatedAt) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin',         'System administrator with full access',    GETUTCDATE(), GETUTCDATE()),
('22222222-2222-2222-2222-222222222222', 'Manager',       'Team lead with oversight capabilities',    GETUTCDATE(), GETUTCDATE()),
('33333333-3333-3333-3333-333333333333', 'Sales Rep',     'Sales team member',                        GETUTCDATE(), GETUTCDATE()),
('44444444-4444-4444-4444-444444444444', 'Support Agent', 'Customer support and live chat agent',     GETUTCDATE(), GETUTCDATE()),
('55555555-5555-5555-5555-555555555555', 'Viewer',        'Read-only access to CRM data',             GETUTCDATE(), GETUTCDATE());
GO

-- Deal Stages
IF NOT EXISTS (SELECT 1 FROM DealStages WHERE Name = 'Prospecting')
INSERT INTO DealStages (Name, OrderIndex, Probability, IsActive) VALUES
('Prospecting',   1, 10,  1),
('Qualification', 2, 25,  1),
('Proposal',      3, 50,  1),
('Negotiation',   4, 75,  1),
('Closed Won',    5, 100, 1),
('Closed Lost',   6, 0,   1);
GO

-- Settings
IF NOT EXISTS (SELECT 1 FROM Settings WHERE SettingKey = 'company_name')
INSERT INTO Settings (SettingKey, SettingValue, Description) VALUES
('company_name',      '"Dhwiti CRM"',           'Company display name'),
('company_timezone',  '"Asia/Kolkata"',          'Default timezone'),
('company_currency',  '"INR"',                   'Default currency'),
('live_chat_enabled', 'true',                    'Enable live chat widget'),
('jitsi_server',      '"https://meet.jit.si"',   'Jitsi video meeting server'),
('gst_rate_default',  '18',                      'Default GST rate (%)'),
('max_file_size_mb',  '10',                      'Maximum file upload size in MB');
GO
-- ============================================================
-- 18. ROLE PERMISSIONS
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RolePermissions' AND xtype='U')
CREATE TABLE RolePermissions (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    RoleId      UNIQUEIDENTIFIER NOT NULL,
    Module      NVARCHAR(100)    NOT NULL,
    Permission  NVARCHAR(100)    NOT NULL,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_RolePermissions_Role FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_RolePermissions UNIQUE (RoleId, Module, Permission)
);
GO

-- ============================================================
-- 19. SUPPORT TICKETING
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tickets' AND xtype='U')
CREATE TABLE Tickets (
    Id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    TicketNumber     NVARCHAR(50)     NOT NULL UNIQUE,
    Title            NVARCHAR(200)    NOT NULL,
    Description      NVARCHAR(MAX)    NOT NULL,
    Status           NVARCHAR(50)     NOT NULL DEFAULT 'Open',
    Priority         NVARCHAR(50)     NOT NULL DEFAULT 'Medium',
    CustomerId       UNIQUEIDENTIFIER NULL,
    AssignedToUserId UNIQUEIDENTIFIER NULL,
    CreatedByUserId  UNIQUEIDENTIFIER NOT NULL,
    CreatedAt        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Tickets_Customer FOREIGN KEY (CustomerId) REFERENCES CustomerMaster(Id),
    CONSTRAINT FK_Tickets_AssignedTo FOREIGN KEY (AssignedToUserId) REFERENCES Users(Id),
    CONSTRAINT FK_Tickets_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TicketComments' AND xtype='U')
CREATE TABLE TicketComments (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    TicketId    UNIQUEIDENTIFIER NOT NULL,
    UserId      UNIQUEIDENTIFIER NOT NULL,
    CommentText NVARCHAR(MAX)    NOT NULL,
    IsInternal  BIT              NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_TicketComments_Ticket FOREIGN KEY (TicketId) REFERENCES Tickets(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TicketComments_User FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

-- ============================================================
-- 20. KNOWLEDGE BASE
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ArticleCategories' AND xtype='U')
CREATE TABLE ArticleCategories (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Name        NVARCHAR(100)    NOT NULL,
    Description NVARCHAR(255)    NULL,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Articles' AND xtype='U')
CREATE TABLE Articles (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    CategoryId  UNIQUEIDENTIFIER NOT NULL,
    Title       NVARCHAR(200)    NOT NULL,
    Content     NVARCHAR(MAX)    NOT NULL,
    Tags        NVARCHAR(200)    NULL,
    AuthorId    UNIQUEIDENTIFIER NOT NULL,
    IsPublished BIT              NOT NULL DEFAULT 0,
    ViewCount   INT              NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Articles_Category FOREIGN KEY (CategoryId) REFERENCES ArticleCategories(Id),
    CONSTRAINT FK_Articles_Author FOREIGN KEY (AuthorId) REFERENCES Users(Id)
);
GO

-- ============================================================
-- VERIFY — Show all tables
-- ============================================================
SELECT
    t.name                          AS [Table],
    p.rows                          AS [Rows],
    CAST(SUM(a.total_pages) * 8 / 1024.0 AS DECIMAL(10,2)) AS [Size KB]
FROM
    sys.tables t
    JOIN sys.indexes i      ON t.object_id = i.object_id
    JOIN sys.indexes i2     ON t.object_id = i2.object_id AND i2.index_id IN (0,1)
    JOIN sys.partitions p   ON i2.object_id = p.object_id AND i2.index_id = p.index_id
    JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE
    i.index_id IN (0,1)
GROUP BY t.name, p.rows
ORDER BY t.name;
GO

PRINT '====================================================';
PRINT '  DhwitiCRM v2.0 — Database Setup Complete!       ';
PRINT '                                                    ';
PRINT '  Flow: Lead → Deal → Order → Invoice → Payment   ';
PRINT '====================================================';
