using System.Collections.Generic;
using System.Threading.Tasks;
using CRM.Application.Features.Feedbacks.DTOs;

namespace CRM.Application.Interfaces
{
    public interface IFeedbackService
    {
        Task<IEnumerable<FeedbackDto>> GetAllFeedbacksAsync();
        Task<FeedbackDto> GetFeedbackByIdAsync(Guid id);
        Task<FeedbackDto> CreateFeedbackAsync(CreateFeedbackDto dto);
        Task UpdateFeedbackStatusAsync(Guid id, UpdateFeedbackDto dto);
        Task DeleteFeedbackAsync(Guid id);
    }
}
