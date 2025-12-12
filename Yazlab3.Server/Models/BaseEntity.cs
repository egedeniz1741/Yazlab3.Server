
using System;
using System.ComponentModel.DataAnnotations;

namespace Yazlab3.Models
{
    public abstract class BaseEntity
    {
        [Key]
        public int Id { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}