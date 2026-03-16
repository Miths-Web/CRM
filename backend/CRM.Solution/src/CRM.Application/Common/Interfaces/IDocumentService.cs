using CRM.Application.Features.Documents.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IDocumentService
    {
        Task<DocumentDto?> GetDocumentByIdAsync(Guid id);
        Task<IReadOnlyList<DocumentDto>> GetPagedDocumentsAsync(int pageNumber, int pageSize);
        Task<DocumentDto> UploadDocumentAsync(UploadDocumentDto uploadDto);
        Task DeleteDocumentAsync(Guid id);
    }
}
