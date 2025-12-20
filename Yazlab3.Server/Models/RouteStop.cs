
using System.ComponentModel.DataAnnotations.Schema;

namespace Yazlab3.Models
{
    public class RouteStop : BaseEntity
    {
        public int DeliveryRouteId { get; set; }
        [ForeignKey("DeliveryRouteId")]
        public virtual DeliveryRoute DeliveryRoute { get; set; }

        public int StationId { get; set; }
        [ForeignKey("StationId")]
        public virtual Station Station { get; set; }

        public int VisitOrder { get; set; } 

        public double LoadedCargoWeight { get; set; } 
    }
}