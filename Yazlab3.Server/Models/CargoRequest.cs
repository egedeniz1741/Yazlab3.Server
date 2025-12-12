// Models/CargoRequest.cs
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yazlab3.Models
{
    public class CargoRequest : BaseEntity
    {
        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        public int TargetStationId { get; set; } // Hangi ilçeye gidiyor
        [ForeignKey("TargetStationId")]
        public virtual Station TargetStation { get; set; }

        public int CargoCount { get; set; } // Kargo Adedi [cite: 10]
        public double WeightKg { get; set; } // Kargo Ağırlığı [cite: 10]

        public DateTime DeliveryDate { get; set; } // Planlanan teslimat tarihi
        public bool IsProcessed { get; set; } = false; // Rota planlamasına dahil edildi mi?
    }
}