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
        public string Password { get; set; } 

        [Required]
        public string Role { get; set; } = "User"; 

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

       
        public virtual ICollection<CargoRequest> CargoRequests { get; set; }
    }
}