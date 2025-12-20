
using System.ComponentModel.DataAnnotations.Schema;

namespace Yazlab3.Models
{
    public class DistanceMatrix : BaseEntity
    {
        public int FromStationId { get; set; }
        public int ToStationId { get; set; }

        public decimal DistanceKm { get; set; }
    }
}