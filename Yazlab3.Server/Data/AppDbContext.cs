using Microsoft.EntityFrameworkCore;
using Yazlab3.Models;

namespace Yazlab3.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Oluşturduğumuz Entity'leri buraya DbSet olarak ekliyoruz
        public DbSet<User> Users { get; set; }
        public DbSet<Station> Stations { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<CargoRequest> CargoRequests { get; set; }
        public DbSet<DeliveryRoute> DeliveryRoutes { get; set; }
        public DbSet<RouteStop> RouteStops { get; set; }
        public DbSet<DistanceMatrix> DistanceMatrices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
           
            base.OnModelCreating(modelBuilder);

           
        }
    }
}