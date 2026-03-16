using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Auth.DTOs
{
    public class ChangePasswordRequestDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$", ErrorMessage = "Password must have at least one uppercase, one lowercase, one number and one special character.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
