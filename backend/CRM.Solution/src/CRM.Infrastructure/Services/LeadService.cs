using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Leads.DTOs;
using CRM.Domain.Entities;
using CRM.Domain.Enums;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;

namespace CRM.Infrastructure.Services
{
    public class LeadService : ILeadService
    {
        private readonly ILeadRepository _leadRepository;
        private readonly ApplicationDbContext _context;

        public LeadService(ILeadRepository leadRepository, ApplicationDbContext context)
        {
            _leadRepository = leadRepository;
            _context        = context;
        }

        public async Task<LeadDto?> GetLeadByIdAsync(Guid id)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            return lead == null ? null : MapToDto(lead);
        }

        public async Task<IReadOnlyList<LeadDto>> GetPagedLeadsAsync(int pageNumber, int pageSize)
        {
            var leads = await _leadRepository.GetPagedResponseAsync(pageNumber, pageSize);
            return leads.Select(MapToDto).ToList();
        }

        public async Task<IReadOnlyList<LeadDto>> GetPagedLeadsByUserAsync(Guid userId, int pageNumber, int pageSize)
        {
            // Strict CRM Rule: Sales rep must only see leads Explicitly assigned to them
            var all = await _leadRepository.FindAsync(l => l.AssignedToUserId == userId);
            return all
                .OrderByDescending(l => l.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(MapToDto)
                .ToList();
        }

        public async Task<LeadDto> CreateLeadAsync(CreateLeadDto createDto)
        {
            // XSS Prevention (Bug #10 Fix): Encode all string inputs before saving
            var enc = HtmlEncoder.Default;
            var lead = new Lead
            {
                Title            = enc.Encode(createDto.Title ?? string.Empty),
                FirstName        = enc.Encode(createDto.FirstName ?? string.Empty),
                LastName         = createDto.LastName != null ? enc.Encode(createDto.LastName) : null,
                Email            = createDto.Email,  // Email intentionally not HTML-encoded (special chars valid)
                Phone            = createDto.Phone,
                Company          = createDto.Company != null ? enc.Encode(createDto.Company) : null,
                JobTitle         = createDto.JobTitle != null ? enc.Encode(createDto.JobTitle) : null,
                Status           = createDto.Status,
                Source           = createDto.Source,
                Score            = 0,
                EstimatedValue   = createDto.EstimatedValue,
                Description      = createDto.Description != null ? enc.Encode(createDto.Description) : null,
                AssignedToUserId = createDto.AssignedToUserId
            };

            var addedLead = await _leadRepository.AddAsync(lead);
            return MapToDto(addedLead);
        }

        // BUG-011 FIX: UpdateLeadDto use karo, CreateLeadDto nahi — Score update ke liye
        public async Task UpdateLeadAsync(Guid id, UpdateLeadDto updateDto)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) throw new NotFoundException("Lead not found");

            // XSS Prevention (Bug #10 Fix): Encode all string inputs before saving
            var enc = HtmlEncoder.Default;
            lead.Title            = enc.Encode(updateDto.Title ?? string.Empty);
            lead.FirstName        = enc.Encode(updateDto.FirstName ?? string.Empty);
            lead.LastName         = updateDto.LastName != null ? enc.Encode(updateDto.LastName) : null;
            lead.Email            = updateDto.Email;
            lead.Phone            = updateDto.Phone;
            lead.Company          = updateDto.Company != null ? enc.Encode(updateDto.Company) : null;
            lead.JobTitle         = updateDto.JobTitle != null ? enc.Encode(updateDto.JobTitle) : null;
            lead.Status           = updateDto.Status;
            lead.Source           = updateDto.Source;
            lead.EstimatedValue   = updateDto.EstimatedValue;
            lead.Description      = updateDto.Description != null ? enc.Encode(updateDto.Description) : null;
            lead.AssignedToUserId = updateDto.AssignedToUserId;
            if (updateDto.Score.HasValue) lead.Score = updateDto.Score.Value;
            lead.UpdatedAt        = DateTime.UtcNow;

            await _leadRepository.UpdateAsync(lead);
        }

        public async Task DeleteLeadAsync(Guid id)
        {
            await _leadRepository.DeleteByIdAsync(id);
        }

        /// <summary>
        /// Lead ko Customer + Company mein convert karta hai.
        /// Naya Company + Customer record banta hai database mein.
        /// BUG-019 FIX: Transaction use kiya — partial save se bachao.
        /// </summary>
        public async Task ConvertLeadAsync(Guid id, Guid currentUserId)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) throw new NotFoundException("Lead not found");
            if (lead.Status == LeadStatus.Converted)
                throw new BusinessException("Lead is already converted.");

            // BUG-019 FIX: Transaction mein wrap karo — atomicity ensure karo
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. CompanyMaster banao (Lead ke company info se)
                var company = new CompanyMaster
                {
                    CompanyName = lead.Company ?? $"{lead.FirstName} {lead.LastName}",
                    Email       = lead.Email,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow,
                    CreatedBy   = currentUserId
                };
                _context.Companies.Add(company);

                // 2. CustomerMaster banao (Lead ke personal info se)
                var customer = new CustomerMaster
                {
                    CompanyId        = company.Id,
                    FirstName        = lead.FirstName ?? "Unknown",
                    LastName         = lead.LastName  ?? "",
                    Email            = lead.Email,
                    PhoneNo          = lead.Phone,
                    Designation      = lead.JobTitle,
                    AssignedToUserId = lead.AssignedToUserId,
                    CreatedDate      = DateTime.UtcNow,
                    UpdatedDate      = DateTime.UtcNow,
                    CreatedBy        = currentUserId
                };
                _context.Customers.Add(customer);

                // 3. Deal (Opportunity) banao — Prospects/Prospecting stage
                var deal = new Deal
                {
                    Title              = $"Deal: {company.CompanyName}",
                    CompanyId          = company.Id,
                    CustomerId         = customer.Id,
                    AssignedToUserId   = lead.AssignedToUserId,
                    StageId            = 1, // Prospecting
                    Status             = Domain.Enums.DealStatus.Open,
                    Value              = lead.EstimatedValue ?? 0,
                    Description        = lead.Description,
                    CreatedAt          = DateTime.UtcNow,
                    UpdatedAt          = DateTime.UtcNow
                };
                _context.Deals.Add(deal);

                // 4. Lead ko Converted mark karo
                lead.Status                 = LeadStatus.Converted;
                lead.ConvertedToCustomerId  = customer.Id;
                lead.ConvertedToCompanyId   = company.Id;
                lead.ConvertedToDealId      = deal.Id; // Link the new deal
                lead.ConvertedAt            = DateTime.UtcNow;
                lead.UpdatedAt              = DateTime.UtcNow;

                // Sab ek saath save karo
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private LeadDto MapToDto(Lead lead)
        {
            return new LeadDto
            {
                Id               = lead.Id,
                Title            = lead.Title,
                FirstName        = lead.FirstName,
                LastName         = lead.LastName,
                Email            = lead.Email,
                Phone            = lead.Phone,
                Company          = lead.Company,
                JobTitle         = lead.JobTitle,
                Status           = lead.Status,
                Source           = lead.Source,
                Score            = lead.Score,
                EstimatedValue   = lead.EstimatedValue,
                Description      = lead.Description,
                AssignedToUserId = lead.AssignedToUserId,
                CreatedAt        = lead.CreatedAt,
                UpdatedAt        = lead.UpdatedAt
            };
        }
    }
}
