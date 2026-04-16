using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Tickets.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class TicketService : ITicketService
    {
        private readonly ApplicationDbContext _context;

        public TicketService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TicketDto?> GetTicketByIdAsync(Guid id)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Customer)
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.Comments)
                    .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return null;
            return MapToDto(ticket);
        }

        public async Task<IReadOnlyList<TicketDto>> GetPagedTicketsAsync(int pageNumber, int pageSize)
        {
            var tickets = await _context.Tickets
                .Include(t => t.Customer)
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return tickets.Select(MapToDto).ToList();
        }

        public async Task<IReadOnlyList<TicketDto>> GetPagedTicketsByUserAsync(Guid userId, int pageNumber, int pageSize)
        {
            var tickets = await _context.Tickets
                .Include(t => t.Customer)
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Where(t => t.AssignedToUserId == userId || t.CreatedByUserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return tickets.Select(MapToDto).ToList();
        }

        public async Task<TicketDto> CreateTicketAsync(CreateTicketDto createDto, Guid currentUserId)
        {
            var ticket = new Ticket
            {
                TicketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                Title = createDto.Title,
                Description = createDto.Description,
                Priority = string.IsNullOrEmpty(createDto.Priority) ? "Medium" : createDto.Priority,
                Status = "Open",
                CustomerId = createDto.CustomerId,
                AssignedToUserId = createDto.AssignedToUserId,
                CreatedByUserId = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            return await GetTicketByIdAsync(ticket.Id) ?? MapToDto(ticket);
        }

        public async Task UpdateTicketAsync(Guid id, UpdateTicketDto updateDto, Guid currentUserId)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket == null) throw new NotFoundException("Ticket not found");

            ticket.Title = updateDto.Title;
            ticket.Description = updateDto.Description;
            ticket.Status = updateDto.Status;
            ticket.Priority = updateDto.Priority;
            ticket.CustomerId = updateDto.CustomerId;
            ticket.AssignedToUserId = updateDto.AssignedToUserId;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<TicketCommentDto> AddCommentAsync(Guid ticketId, CreateTicketCommentDto commentDto, Guid currentUserId)
        {
            var ticket = await _context.Tickets.FindAsync(ticketId);
            if (ticket == null) throw new NotFoundException("Ticket not found");

            var comment = new TicketComment
            {
                TicketId = ticketId,
                UserId = currentUserId,
                CommentText = commentDto.CommentText,
                IsInternal = commentDto.IsInternal,
                CreatedAt = DateTime.UtcNow
            };

            _context.TicketComments.Add(comment);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(currentUserId);

            return new TicketCommentDto
            {
                Id = comment.Id,
                TicketId = comment.TicketId,
                UserId = comment.UserId,
                UserName = user != null ? $"{user.FirstName} {user.LastName}" : null,
                CommentText = comment.CommentText,
                IsInternal = comment.IsInternal,
                CreatedAt = comment.CreatedAt
            };
        }

        public async Task DeleteTicketAsync(Guid id)
        {
            var ticket = await _context.Tickets.FindAsync(id);
            if (ticket != null)
            {
                _context.Tickets.Remove(ticket);
                await _context.SaveChangesAsync();
            }
        }

        private TicketDto MapToDto(Ticket ticket)
        {
            return new TicketDto
            {
                Id = ticket.Id,
                TicketNumber = ticket.TicketNumber,
                Title = ticket.Title,
                Description = ticket.Description,
                Status = ticket.Status,
                Priority = ticket.Priority,
                CustomerId = ticket.CustomerId,
                CustomerName = ticket.Customer != null ? $"{ticket.Customer.FirstName} {ticket.Customer.LastName}" : null,
                AssignedToUserId = ticket.AssignedToUserId,
                AssignedToName = ticket.AssignedToUser != null ? $"{ticket.AssignedToUser.FirstName} {ticket.AssignedToUser.LastName}" : null,
                CreatedByUserId = ticket.CreatedByUserId,
                CreatedByName = ticket.CreatedByUser != null ? $"{ticket.CreatedByUser.FirstName} {ticket.CreatedByUser.LastName}" : null,
                CreatedAt = ticket.CreatedAt,
                UpdatedAt = ticket.UpdatedAt,
                Comments = ticket.Comments.Select(c => new TicketCommentDto
                {
                    Id = c.Id,
                    TicketId = c.TicketId,
                    UserId = c.UserId,
                    UserName = c.User != null ? $"{c.User.FirstName} {c.User.LastName}" : null,
                    CommentText = c.CommentText,
                    IsInternal = c.IsInternal,
                    CreatedAt = c.CreatedAt
                }).ToList()
            };
        }
    }
}
