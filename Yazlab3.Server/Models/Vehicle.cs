
using System.ComponentModel.DataAnnotations;

namespace Yazlab3.Models
{
    public class Vehicle : BaseEntity
    {
        [Required]
        public string Name { get; set; } 

        public int CapacityKg { get; set; } 

        public decimal FuelCostPerKm { get; set; } = 1; 

        public decimal RentalCost { get; set; } 

        public bool IsRented { get; set; } 
    }
}