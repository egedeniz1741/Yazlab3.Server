// Models/RouteStop.cs
// Rotadaki her bir durağı temsil eder (Örn: 1. durak Gebze, 2. durak Dilovası)
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

        public int VisitOrder { get; set; } // 1, 2, 3...

        public double LoadedCargoWeight { get; set; } // O durakta indirilen yük miktarı (İsteğe bağlı analiz için)
    }
}