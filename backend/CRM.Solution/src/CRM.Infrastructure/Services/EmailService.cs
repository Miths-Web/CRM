using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Emails.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Jobs;
using Hangfire;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    /// <summary>
    /// EmailService — saves email records to DB.
    /// Actual delivery is handled by EmailBackgroundJob via Hangfire (non-blocking).
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IEmailRepository _emailRepository;

        public EmailService(IEmailRepository emailRepository)
        {
            _emailRepository = emailRepository;
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
            var isScheduled = createDto.ScheduledAt.HasValue && createDto.ScheduledAt.Value > DateTime.UtcNow;

            var email = new Email
            {
                Subject          = createDto.Subject,
                Body             = createDto.Body,
                ToEmail          = createDto.ToEmail,
                CcEmails         = createDto.CcEmails,
                BccEmails        = createDto.BccEmails,
                Status           = isScheduled ? "Scheduled" : "Sent",
                ScheduledAt      = createDto.ScheduledAt,
                SentAt           = isScheduled ? null : DateTime.UtcNow,
                TemplateId       = createDto.TemplateId,
                RelatedCustomerId = createDto.RelatedCustomerId,
                RelatedLeadId    = createDto.RelatedLeadId,
                RelatedDealId    = createDto.RelatedDealId,
                CreatedAt        = DateTime.UtcNow
            };

            var added = await _emailRepository.AddAsync(email);

            // ✅ FIX: Enqueue the actual SendGrid delivery as a background job
            if (isScheduled)
            {
                // Scheduled email — Hangfire will run it at the specified time
                BackgroundJob.Schedule<EmailBackgroundJob>(
                    job => job.SendEmailAsync(createDto.ToEmail, createDto.Subject, createDto.Body, null),
                    createDto.ScheduledAt!.Value);
            }
            else
            {
                // Send immediately in background (non-blocking)
                BackgroundJob.Enqueue<EmailBackgroundJob>(
                    job => job.SendEmailAsync(createDto.ToEmail, createDto.Subject, createDto.Body, null));
            }

            return MapToDto(added);
        }

        private static EmailDto MapToDto(Email email) => new()
        {
            Id               = email.Id,
            Subject          = email.Subject,
            Body             = email.Body,
            FromEmail        = email.FromEmail,
            ToEmail          = email.ToEmail,
            CcEmails         = email.CcEmails,
            BccEmails        = email.BccEmails,
            Status           = email.Status,
            ScheduledAt      = email.ScheduledAt,
            SentAt           = email.SentAt,
            OpenedAt         = email.OpenedAt,
            ClickedAt        = email.ClickedAt,
            TemplateId       = email.TemplateId,
            RelatedCustomerId = email.RelatedCustomerId,
            RelatedLeadId    = email.RelatedLeadId,
            RelatedDealId    = email.RelatedDealId,
            CreatedAt        = email.CreatedAt
        };
    }
}

