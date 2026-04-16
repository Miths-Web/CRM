using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CRM.Application.Interfaces;
using CRM.Application.Features.Feedbacks.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;

namespace CRM.Infrastructure.Services
{
    public class FeedbackService : IFeedbackService
    {
        private readonly ApplicationDbContext _context;

        public FeedbackService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<FeedbackDto>> GetAllFeedbacksAsync()
        {
            return await _context.Feedbacks
                .Include(f => f.Customer)
                .Include(f => f.AssignedToUser)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FeedbackDto
                {
                    Id = f.Id,
                    CustomerId = f.CustomerId,
                    CustomerName = f.Customer.FirstName + " " + f.Customer.LastName,
                    Rating = f.Rating,
                    Category = f.Category,
                    Subject = f.Subject,
                    Comments = f.Comments,
                    Status = f.Status,
                    AssignedToUserId = f.AssignedToUserId,
                    AssignedToUserName = f.AssignedToUser != null ? f.AssignedToUser.FirstName + " " + f.AssignedToUser.LastName : null,
                    CreatedAt = f.CreatedAt
                }).ToListAsync();
        }

        public async Task<FeedbackDto> GetFeedbackByIdAsync(Guid id)
        {
            var f = await _context.Feedbacks
                .Include(f => f.Customer)
                .Include(f => f.AssignedToUser)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (f == null) throw new Exception("Feedback not found.");

            return new FeedbackDto
            {
                Id = f.Id,
                CustomerId = f.CustomerId,
                CustomerName = f.Customer.FirstName + " " + f.Customer.LastName,
                Rating = f.Rating,
                Category = f.Category,
                Subject = f.Subject,
                Comments = f.Comments,
                Status = f.Status,
                AssignedToUserId = f.AssignedToUserId,
                AssignedToUserName = f.AssignedToUser != null ? f.AssignedToUser.FirstName + " " + f.AssignedToUser.LastName : null,
                CreatedAt = f.CreatedAt
            };
        }

        public async Task<FeedbackDto> CreateFeedbackAsync(CreateFeedbackDto dto)
        {
            var f = new Feedback
            {
                CustomerId = dto.CustomerId,
                Rating = dto.Rating,
                Category = dto.Category,
                Subject = dto.Subject,
                Comments = dto.Comments,
                Status = "New",
                CreatedAt = DateTime.UtcNow
            };

            _context.Feedbacks.Add(f);
            await _context.SaveChangesAsync();

            return await GetFeedbackByIdAsync(f.Id);
        }

        public async Task UpdateFeedbackStatusAsync(Guid id, UpdateFeedbackDto dto)
        {
            var f = await _context.Feedbacks.FindAsync(id);
            if (f == null) throw new Exception("Feedback not found.");

            if (!string.IsNullOrEmpty(dto.Status)) f.Status = dto.Status;
            f.AssignedToUserId = dto.AssignedToUserId;
            f.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteFeedbackAsync(Guid id)
        {
            var f = await _context.Feedbacks.FindAsync(id);
            if (f != null)
            {
                _context.Feedbacks.Remove(f);
                await _context.SaveChangesAsync();
            }
        }
    }
}
