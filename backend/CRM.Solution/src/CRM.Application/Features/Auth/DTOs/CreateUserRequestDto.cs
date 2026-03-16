using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Auth.DTOs
{
    /// <summary>
    /// Admin ke liye naya user create karne ka DTO.
    /// Isme Role field required hai — Admin specific role assign karta hai.
    /// </summary>
    public class CreateUserRequestDto
    {
        [Required(ErrorMessage = "First Name is required")]
        [StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last Name is required")]
        [StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$",
            ErrorMessage = "Password must have uppercase, lowercase, number and special character.")]
        public string Password { get; set; } = string.Empty;

        [Phone]
        public string? Phone { get; set; }

        /// <summary>
        /// Required — Admin must choose: Admin | Manager | Sales Rep | Support Agent | Viewer
        /// </summary>
        [Required(ErrorMessage = "Role is required")]
        public string Role { get; set; } = "Viewer";
    }
}
