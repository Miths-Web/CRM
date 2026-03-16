using CRM.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IDealRepository : IGenericRepository<Deal>
    {
        Task<IReadOnlyList<Deal>> GetDealsByStageAsync(int stageId);
        Task<IReadOnlyList<DealStage>> GetAllStagesAsync();
        Task<IReadOnlyList<Deal>> GetPagedDealsWithIncludesAsync(int pageNumber, int pageSize);
        Task<Deal?> GetDealWithIncludesByIdAsync(Guid id);
    }
}
