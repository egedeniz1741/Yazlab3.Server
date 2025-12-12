// Models/DeliveryRoute.cs
// Bir aracın bir günlük seferini temsil eder.
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yazlab3.Models
{
    public class DeliveryRoute : BaseEntity
    {
        public int VehicleId { get; set; }
        [ForeignKey("VehicleId")]
        public virtual Vehicle Vehicle { get; set; }

        public DateTime RouteDate { get; set; }

        public decimal TotalDistanceKm { get; set; }
        public decimal TotalCost { get; set; } // (Yol * 1) + Kiralama Bedeli

        // Bu rotadaki duraklar (Sırasıyla tutulacak)
        public virtual ICollection<RouteStop> Stops { get; set; }
    }
}