
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
        public decimal TotalCost { get; set; } 

        
        public virtual ICollection<RouteStop> Stops { get; set; }
        public bool IsArchived { get; set; } = false;
    }
}