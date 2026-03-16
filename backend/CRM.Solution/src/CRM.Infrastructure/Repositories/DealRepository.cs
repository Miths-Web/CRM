using CRM.Application.Common.Interfaces;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Repositories
{
    public class DealRepository : GenericRepository<Deal>, IDealRepository
    {
        public DealRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<Deal>> GetDealsByStageAsync(int stageId)
        {
            return await _dbContext.Deals
                .Where(d => d.StageId == stageId)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<DealStage>> GetAllStagesAsync()
        {
            return await _dbContext.DealStages
                .OrderBy(s => s.OrderIndex)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Deal>> GetPagedDealsWithIncludesAsync(int pageNumber, int pageSize)
        {
            return await _dbContext.Deals
                .Include(d => d.Company)
                .Include(d => d.Customer)
                .Include(d => d.Stage)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Deal?> GetDealWithIncludesByIdAsync(Guid id)
        {
            return await _dbContext.Deals
                .Include(d => d.Company)
                .Include(d => d.Customer)
                .Include(d => d.Stage)
                .FirstOrDefaultAsync(d => d.Id == id);
        }
    }
}
