using System;
using System.Collections.Generic;

namespace CRM.Application.Features.Reports
{
    /// <summary>
    /// DTO for the main CRM Dashboard showing key business KPIs.
    /// </summary>
    public class DashboardDto
    {
        // Counts
        public int TotalContacts { get; set; }
        public int TotalLeads { get; set; }
        public int TotalDeals { get; set; }
        public int OpenTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int UpcomingEvents { get; set; }

        // Financial
        public decimal TotalPipelineValue { get; set; }
        public decimal TotalClosedWonValue { get; set; }
        public decimal AverageDealSize { get; set; }

        // Rates
        public double LeadConversionRate { get; set; }
        public double DealWinRate { get; set; }

        // Recent Activity
        public List<RecentActivityDto> RecentActivities { get; set; } = new();
        public List<TopDealDto> TopDeals { get; set; } = new();
    }

    public class RecentActivityDto
    {
        public string Type { get; set; } = string.Empty; // "Contact", "Lead", "Deal", "Task"
        public string Title { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // "Created", "Updated", "Closed"
        public DateTime Timestamp { get; set; }
    }

    public class TopDealDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string StageName { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
    }

    public class SalesReportDto
    {
        public string Period { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int DealsWon { get; set; }
        public int DealsLost { get; set; }
        public List<MonthlySalesDto> MonthlyBreakdown { get; set; } = new();
    }

    public class MonthlySalesDto
    {
        public string Month { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int DealsCount { get; set; }
    }
}
