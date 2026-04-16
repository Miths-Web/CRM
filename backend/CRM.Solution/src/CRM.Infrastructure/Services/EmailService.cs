using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Emails.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Jobs;
using Hangfire;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    /// <summary>
    /// EmailService — saves email records to DB.
    /// Actual delivery is handled by EmailBackgroundJob via Hangfire (non-blocking).
    /// Issue #6 FIX: Subject/Body sanitize + FromEmail config se + input guards added.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IEmailRepository _emailRepository;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(IEmailRepository emailRepository, IConfiguration configuration)
        {
            _emailRepository = emailRepository;
            // Issue #6 FIX: FromEmail ab appsettings.json se aata hai, hardcoded nahi
            _fromEmail = configuration["SendGrid:FromEmail"] ?? "noreply@dhwiticrm.com";
            _fromName  = configuration["SendGrid:FromName"]  ?? "Dhwiti CRM";
        }

        public async Task<EmailDto?> GetEmailByIdAsync(Guid id)
        {
            var email = await _emailRepository.GetByIdAsync(id);
            return email == null ? null : MapToDto(email);
        }

        public async Task<IReadOnlyList<EmailDto>> GetPagedEmailsAsync(int pageNumber, int pageSize)
        {
            var emails = await _emailRepository.GetPagedResponseAsync(pageNumber, pageSize);
            return emails.Select(MapToDto).ToList();
        }

        public async Task<EmailDto> SendEmailAsync(CreateEmailDto createDto)
        {
            // Issue #6 FIX: Input sanitization — HTML tags Subject mein nahi chalenge (injection prevention)
            var sanitizedSubject = StripHtml(createDto.Subject).Trim();
            if (sanitizedSubject.Length > 300)
                sanitizedSubject = sanitizedSubject[..300];

            // Body zyada badi nahi honi chahiye (15 MB text limit for base64 attachments)
            if (!string.IsNullOrEmpty(createDto.Body) && createDto.Body.Length > 15_000_000)
                throw new ArgumentException("Email body is too large (max 15 MB text).");

            var isScheduled = createDto.ScheduledAt.HasValue && createDto.ScheduledAt.Value > DateTime.UtcNow;

            var email = new Email
            {
                Subject           = sanitizedSubject,
                Body              = createDto.Body,
                FromEmail         = _fromEmail,     // Issue #6 FIX: Config se set
                ToEmail           = createDto.ToEmail.Trim().ToLower(),
                CcEmails          = createDto.CcEmails,
                BccEmails         = createDto.BccEmails,
                Status            = isScheduled ? "Scheduled" : "Sent",
                ScheduledAt       = createDto.ScheduledAt,
                SentAt            = isScheduled ? null : DateTime.UtcNow,
                TemplateId        = createDto.TemplateId,
                RelatedCustomerId = createDto.RelatedCustomerId,
                RelatedLeadId     = createDto.RelatedLeadId,
                RelatedDealId     = createDto.RelatedDealId,
                CreatedAt         = DateTime.UtcNow
            };

            var added = await _emailRepository.AddAsync(email);

            if (isScheduled)
            {
                BackgroundJob.Schedule<EmailBackgroundJob>(
                    job => job.SendEmailAsync(createDto.ToEmail, sanitizedSubject, createDto.Body, null),
                    createDto.ScheduledAt!.Value);
            }
            else
            {
                BackgroundJob.Enqueue<EmailBackgroundJob>(
                    job => job.SendEmailAsync(createDto.ToEmail, sanitizedSubject, createDto.Body, null));
            }

            return MapToDto(added);
        }

        // Issue #6 FIX: Simple HTML stripper — script/tags injection prevent karta hai
        private static string StripHtml(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            return Regex.Replace(input, "<.*?>", string.Empty);
        }

        public async Task<bool> DeleteEmailAsync(Guid id)
        {
            var email = await _emailRepository.GetByIdAsync(id);
            if (email == null) return false;
            
            // Soft delete - move to trash
            email.Status = "Trash";
            await _emailRepository.UpdateAsync(email);
            return true;
        }

        public async Task<EmailDto?> ToggleStarAsync(Guid id)
        {
            var email = await _emailRepository.GetByIdAsync(id);
            if (email == null) return null;
            
            email.IsStarred = !email.IsStarred;
            await _emailRepository.UpdateAsync(email);
            return MapToDto(email);
        }

        public async Task<EmailDto?> ArchiveEmailAsync(Guid id)
        {
            var email = await _emailRepository.GetByIdAsync(id);
            if (email == null) return null;
            
            email.IsArchived = true;
            await _emailRepository.UpdateAsync(email);
            return MapToDto(email);
        }

        private static EmailDto MapToDto(Email email) => new()
        {
            Id                = email.Id,
            Subject           = email.Subject,
            Body              = email.Body,
            FromEmail         = email.FromEmail,
            ToEmail           = email.ToEmail,
            CcEmails          = email.CcEmails,
            BccEmails         = email.BccEmails,
            Status            = email.Status,
            ScheduledAt       = email.ScheduledAt,
            SentAt            = email.SentAt,
            OpenedAt          = email.OpenedAt,
            ClickedAt         = email.ClickedAt,
            TemplateId        = email.TemplateId,
            RelatedCustomerId = email.RelatedCustomerId,
            RelatedLeadId     = email.RelatedLeadId,
            RelatedDealId     = email.RelatedDealId,
            IsStarred         = email.IsStarred,
            IsArchived        = email.IsArchived,
            CreatedAt         = email.CreatedAt
        };
    }
}

