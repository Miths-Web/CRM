using CRM.Application.Features.Notes.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface INoteService
    {
        Task<NoteDto?> GetNoteByIdAsync(Guid id);
        Task<IReadOnlyList<NoteDto>> GetPagedNotesAsync(int pageNumber, int pageSize);
        Task<NoteDto> CreateNoteAsync(CreateNoteDto createDto);
        Task UpdateNoteAsync(Guid id, CreateNoteDto updateDto);
        Task DeleteNoteAsync(Guid id);
    }
}
