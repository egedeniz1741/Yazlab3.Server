// Models/Station.cs
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Yazlab3.Models
{
    public class Station : BaseEntity
    {
        [Required]
        public string Name { get; set; } // Örn: Gebze, İzmit

        // MySQL'de koordinat hassasiyeti için decimal kullanılır
        [Column(TypeName = "decimal(10, 7)")]
        public decimal Latitude { get; set; }

        [Column(TypeName = "decimal(10, 7)")]
        public decimal Longitude { get; set; }
    }
}