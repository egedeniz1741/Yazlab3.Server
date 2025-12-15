using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yazlab3.Models
{
    public class CargoRequest : BaseEntity
    {
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        // DİKKAT: Buraya '?' ekledik (User? yaptık)
        public virtual User? User { get; set; }

        public int TargetStationId { get; set; }

        [ForeignKey("TargetStationId")]
        // DİKKAT: Buraya da '?' ekledik (Station? yaptık)
        public virtual Station? TargetStation { get; set; }

        public int CargoCount { get; set; }
        public double WeightKg { get; set; }

        public DateTime DeliveryDate { get; set; }
        public bool IsProcessed { get; set; } = false;
    }
}