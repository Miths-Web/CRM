using CRM.Application.Common.Interfaces;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;

namespace CRM.Infrastructure.Repositories
{
    public class QuoteRepository : GenericRepository<Quote>, IQuoteRepository
    {
        public QuoteRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }
    }
}
