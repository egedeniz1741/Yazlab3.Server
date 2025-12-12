// Models/Vehicle.cs
using System.ComponentModel.DataAnnotations;

namespace Yazlab3.Models
{
    public class Vehicle : BaseEntity
    {
        [Required]
        public string Name { get; set; } // Örn: "Araç 1", "Kiralık Araç A"

        public int CapacityKg { get; set; } // 500, 750, 1000 [cite: 39]

        public decimal FuelCostPerKm { get; set; } = 1; // Varsayılan 1 birim [cite: 37]

        public decimal RentalCost { get; set; } // Mevcut araçlar için 0, kiralık için 200 [cite: 40]

        public bool IsRented { get; set; } // Sonradan mı kiralandı?
    }
}