BEGIN TRANSACTION;
GO

CREATE TABLE [ArticleCategories] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ArticleCategories] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Quotes] (
    [Id] uniqueidentifier NOT NULL,
    [QuoteNumber] nvarchar(450) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [DealId] uniqueidentifier NULL,
    [CustomerId] uniqueidentifier NULL,
    [CompanyId] uniqueidentifier NULL,
    [QuoteDate] datetime2 NOT NULL,
    [ValidUntil] datetime2 NOT NULL,
    [SubTotal] decimal(18,2) NOT NULL,
    [DiscountAmount] decimal(18,2) NOT NULL,
    [TaxAmount] decimal(18,2) NOT NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [Notes] nvarchar(max) NULL,
    [TermsConditions] nvarchar(max) NULL,
    [AssignedToUserId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedByUserId] uniqueidentifier NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [UpdatedByUserId] uniqueidentifier NULL,
    CONSTRAINT [PK_Quotes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Quotes_CompanyMaster_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [CompanyMaster] ([Id]),
    CONSTRAINT [FK_Quotes_CustomerMaster_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [CustomerMaster] ([Id]),
    CONSTRAINT [FK_Quotes_Deals_DealId] FOREIGN KEY ([DealId]) REFERENCES [Deals] ([Id]),
    CONSTRAINT [FK_Quotes_Users_AssignedToUserId] FOREIGN KEY ([AssignedToUserId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_Quotes_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_Quotes_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id])
);
GO

CREATE TABLE [RolePermissions] (
    [Id] uniqueidentifier NOT NULL,
    [RoleId] uniqueidentifier NOT NULL,
    [Module] nvarchar(450) NOT NULL,
    [Permission] nvarchar(450) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RolePermissions_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Tickets] (
    [Id] uniqueidentifier NOT NULL,
    [TicketNumber] nvarchar(450) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [Priority] nvarchar(max) NOT NULL,
    [CustomerId] uniqueidentifier NULL,
    [AssignedToUserId] uniqueidentifier NULL,
    [CreatedByUserId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Tickets_CustomerMaster_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [CustomerMaster] ([Id]),
    CONSTRAINT [FK_Tickets_Users_AssignedToUserId] FOREIGN KEY ([AssignedToUserId]) REFERENCES [Users] ([Id]),
    CONSTRAINT [FK_Tickets_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id])
);
GO

CREATE TABLE [Articles] (
    [Id] uniqueidentifier NOT NULL,
    [CategoryId] uniqueidentifier NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [Tags] nvarchar(max) NULL,
    [AuthorId] uniqueidentifier NOT NULL,
    [IsPublished] bit NOT NULL,
    [ViewCount] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Articles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Articles_ArticleCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [ArticleCategories] ([Id]),
    CONSTRAINT [FK_Articles_Users_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [Users] ([Id])
);
GO

CREATE TABLE [QuoteItems] (
    [Id] uniqueidentifier NOT NULL,
    [QuoteId] uniqueidentifier NOT NULL,
    [ProductId] uniqueidentifier NULL,
    [Description] nvarchar(max) NOT NULL,
    [Quantity] decimal(10,2) NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [DiscountPct] decimal(5,2) NOT NULL,
    [TaxRate] decimal(5,2) NOT NULL,
    [LineTotal] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_QuoteItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_QuoteItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]),
    CONSTRAINT [FK_QuoteItems_Quotes_QuoteId] FOREIGN KEY ([QuoteId]) REFERENCES [Quotes] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [TicketComments] (
    [Id] uniqueidentifier NOT NULL,
    [TicketId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [CommentText] nvarchar(max) NOT NULL,
    [IsInternal] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_TicketComments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TicketComments_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_TicketComments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO

CREATE INDEX [IX_Articles_AuthorId] ON [Articles] ([AuthorId]);
GO

CREATE INDEX [IX_Articles_CategoryId] ON [Articles] ([CategoryId]);
GO

CREATE INDEX [IX_QuoteItems_ProductId] ON [QuoteItems] ([ProductId]);
GO

CREATE INDEX [IX_QuoteItems_QuoteId] ON [QuoteItems] ([QuoteId]);
GO

CREATE INDEX [IX_Quotes_AssignedToUserId] ON [Quotes] ([AssignedToUserId]);
GO

CREATE INDEX [IX_Quotes_CompanyId] ON [Quotes] ([CompanyId]);
GO

CREATE INDEX [IX_Quotes_CreatedByUserId] ON [Quotes] ([CreatedByUserId]);
GO

CREATE INDEX [IX_Quotes_CustomerId] ON [Quotes] ([CustomerId]);
GO

CREATE INDEX [IX_Quotes_DealId] ON [Quotes] ([DealId]);
GO

CREATE UNIQUE INDEX [IX_Quotes_QuoteNumber] ON [Quotes] ([QuoteNumber]);
GO

CREATE INDEX [IX_Quotes_UpdatedByUserId] ON [Quotes] ([UpdatedByUserId]);
GO

CREATE UNIQUE INDEX [IX_RolePermissions_RoleId_Module_Permission] ON [RolePermissions] ([RoleId], [Module], [Permission]);
GO

CREATE INDEX [IX_TicketComments_TicketId] ON [TicketComments] ([TicketId]);
GO

CREATE INDEX [IX_TicketComments_UserId] ON [TicketComments] ([UserId]);
GO

CREATE INDEX [IX_Tickets_AssignedToUserId] ON [Tickets] ([AssignedToUserId]);
GO

CREATE INDEX [IX_Tickets_CreatedByUserId] ON [Tickets] ([CreatedByUserId]);
GO

CREATE INDEX [IX_Tickets_CustomerId] ON [Tickets] ([CustomerId]);
GO

CREATE UNIQUE INDEX [IX_Tickets_TicketNumber] ON [Tickets] ([TicketNumber]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260329052514_SupportAndKnowledgeBase', N'8.0.24');
GO

COMMIT;
GO

