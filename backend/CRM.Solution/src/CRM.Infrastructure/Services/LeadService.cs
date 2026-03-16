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

        public async Task<LeadDto> CreateLeadAsync(CreateLeadDto createDto)
        {
            var lead = new Lead
            {
                Title            = createDto.Title,
                FirstName        = createDto.FirstName,
                LastName         = createDto.LastName,
                Email            = createDto.Email,
                Phone            = createDto.Phone,
                Company          = createDto.Company,
                JobTitle         = createDto.JobTitle,
                Status           = createDto.Status,
                Source           = createDto.Source,
                Score            = 0,
                EstimatedValue   = createDto.EstimatedValue,
                Description      = createDto.Description,
                AssignedToUserId = createDto.AssignedToUserId
            };

            var addedLead = await _leadRepository.AddAsync(lead);
            return MapToDto(addedLead);
        }

        public async Task UpdateLeadAsync(Guid id, CreateLeadDto updateDto)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) throw new NotFoundException("Lead not found");

            lead.Title            = updateDto.Title;
            lead.FirstName        = updateDto.FirstName;
            lead.LastName         = updateDto.LastName;
            lead.Email            = updateDto.Email;
            lead.Phone            = updateDto.Phone;
            lead.Company          = updateDto.Company;
            lead.JobTitle         = updateDto.JobTitle;
            lead.Status           = updateDto.Status;
            lead.Source           = updateDto.Source;
            lead.EstimatedValue   = updateDto.EstimatedValue;
            lead.Description      = updateDto.Description;
            lead.AssignedToUserId = updateDto.AssignedToUserId;
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
        /// </summary>
        public async Task ConvertLeadAsync(Guid id, Guid currentUserId)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) throw new NotFoundException("Lead not found");
            if (lead.Status == LeadStatus.Converted)
                throw new BusinessException("Lead is already converted.");

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
            await _context.SaveChangesAsync();

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
            await _context.SaveChangesAsync();

            // 3. Lead ko Converted mark karo
            lead.Status                 = LeadStatus.Converted;
            lead.ConvertedToCustomerId  = customer.Id;
            lead.ConvertedToCompanyId   = company.Id;
            lead.ConvertedAt            = DateTime.UtcNow;
            lead.UpdatedAt              = DateTime.UtcNow;

            await _leadRepository.UpdateAsync(lead);
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
