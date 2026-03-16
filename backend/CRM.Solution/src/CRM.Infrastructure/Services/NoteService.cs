using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Notes.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class NoteService : INoteService
    {
        private readonly ApplicationDbContext _context;

        public NoteService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<NoteDto?> GetNoteByIdAsync(Guid id)
        {
            var note = await _context.Notes.FindAsync(id);
            return note == null ? null : MapToDto(note);
        }

        public async Task<IReadOnlyList<NoteDto>> GetPagedNotesAsync(int pageNumber, int pageSize)
        {
            var notes = await _context.Notes
                .OrderByDescending(n => n.IsPinned)
                .ThenByDescending(n => n.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
            return notes.Select(MapToDto).ToList();
        }

        public async Task<NoteDto> CreateNoteAsync(CreateNoteDto dto)
        {
            var note = new Note
            {
                Title            = dto.Title,
                Content          = dto.Content,
                Category         = dto.Category,
                IsPinned         = dto.IsPinned,
                RelatedCustomerId = dto.RelatedCustomerId,
                RelatedLeadId    = dto.RelatedLeadId,
                RelatedDealId    = dto.RelatedDealId,
                CreatedAt        = DateTime.UtcNow,
                UpdatedAt        = DateTime.UtcNow
            };
            _context.Notes.Add(note);
            await _context.SaveChangesAsync();
            return MapToDto(note);
        }

        public async Task UpdateNoteAsync(Guid id, CreateNoteDto dto)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null) return;
            note.Title            = dto.Title;
            note.Content          = dto.Content;
            note.Category         = dto.Category;
            note.IsPinned         = dto.IsPinned;
            note.RelatedCustomerId = dto.RelatedCustomerId;
            note.RelatedLeadId    = dto.RelatedLeadId;
            note.RelatedDealId    = dto.RelatedDealId;
            note.UpdatedAt        = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteNoteAsync(Guid id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null) return;
            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();
        }

        private static NoteDto MapToDto(Note note) => new NoteDto
        {
            Id               = note.Id,
            Title            = note.Title,
            Content          = note.Content,
            Category         = note.Category,
            IsPinned         = note.IsPinned,
            RelatedCustomerId = note.RelatedCustomerId,
            RelatedLeadId    = note.RelatedLeadId,
            RelatedDealId    = note.RelatedDealId,
            CreatedAt        = note.CreatedAt,
            UpdatedAt        = note.UpdatedAt
        };
    }
}


