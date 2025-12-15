// Models/User.cs
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Yazlab3.Models
{
    public class User : BaseEntity
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; } // Gerçek hayatta Hashlenmeli

        [Required]
        public string Role { get; set; } = "User"; // "Admin" veya "User"

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Kullanıcının kargo talepleri
        public virtual ICollection<CargoRequest> CargoRequests { get; set; }
    }
}