using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Documents.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly ApplicationDbContext _context;

        public DocumentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DocumentDto?> GetDocumentByIdAsync(Guid id)
        {
            var doc = await _context.Documents.FindAsync(id);
            return doc == null ? null : MapToDto(doc);
        }

        public async Task<IReadOnlyList<DocumentDto>> GetPagedDocumentsAsync(int pageNumber, int pageSize)
        {
            var docs = await _context.Documents
                .OrderByDescending(d => d.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
            return docs.Select(MapToDto).ToList();
        }

        public async Task<DocumentDto> UploadDocumentAsync(UploadDocumentDto dto)
        {
            var doc = new Document
            {
                FileName         = dto.FileName,
                OriginalFileName = dto.FileName,
                MimeType         = dto.ContentType,
                FileSize         = dto.Length,
                Category         = dto.Category,
                FilePath         = $"/uploads/{Guid.NewGuid()}_{dto.FileName}",
                RelatedCustomerId = dto.RelatedCustomerId,
                RelatedLeadId    = dto.RelatedLeadId,
                RelatedDealId    = dto.RelatedDealId,
                CreatedAt        = DateTime.UtcNow
            };
            _context.Documents.Add(doc);
            await _context.SaveChangesAsync();
            return MapToDto(doc);
        }

        public async Task DeleteDocumentAsync(Guid id)
        {
            var doc = await _context.Documents.FindAsync(id);
            if (doc == null) return;
            _context.Documents.Remove(doc);
            await _context.SaveChangesAsync();
        }

        private static DocumentDto MapToDto(Document doc) => new DocumentDto
        {
            Id               = doc.Id,
            FileName         = doc.FileName,
            OriginalFileName = doc.OriginalFileName,
            FilePath         = doc.FilePath,
            FileSize         = doc.FileSize,
            MimeType         = doc.MimeType,
            Category         = doc.Category,
            RelatedCustomerId = doc.RelatedCustomerId,
            RelatedLeadId    = doc.RelatedLeadId,
            RelatedDealId    = doc.RelatedDealId,
            CreatedAt        = doc.CreatedAt
        };
    }
}

