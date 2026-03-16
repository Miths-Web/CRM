using CRM.Domain.Entities;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
    }
}
