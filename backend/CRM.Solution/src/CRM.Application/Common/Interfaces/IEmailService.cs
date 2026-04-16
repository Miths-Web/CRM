using CRM.Application.Features.Emails.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IEmailService
    {
        Task<EmailDto?> GetEmailByIdAsync(Guid id);
        Task<IReadOnlyList<EmailDto>> GetPagedEmailsAsync(int pageNumber, int pageSize);
        Task<EmailDto> SendEmailAsync(CreateEmailDto createDto);
        Task<bool> DeleteEmailAsync(Guid id);
        Task<EmailDto?> ToggleStarAsync(Guid id);
        Task<EmailDto?> ArchiveEmailAsync(Guid id);
    }
}
