using Yazlab3.Models;
using System.Linq;

namespace Yazlab3.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            // 1. Admin Kullanıcısını Kontrol Et
            if (!context.Users.Any(u => u.Username == "admin"))
            {
                context.Users.Add(new User { Username = "admin", Password = "123", Role = "Admin" });
            }

            // 2. Müşteri Kullanıcısını Kontrol Et
            if (!context.Users.Any(u => u.Username == "musteri"))
            {
                context.Users.Add(new User { Username = "musteri", Password = "123", Role = "User" });
            }

            // 3. İstasyonlar (Boşsa ekle)
            if (!context.Stations.Any())
            {
                var stations = new Station[]
               {
                    new Station { Name = "Başiskele", Latitude = 40.71513273972544m, Longitude = 29.934585966660965m },
                    new Station { Name = "Çayırova", Latitude = 40.82396766160747m, Longitude = 29.372155170239854m },
                    new Station { Name = "Darıca", Latitude = 40.7740807309172m, Longitude = 29.400001319983225m },
                    new Station { Name = "Derince", Latitude = 40.756136131743354m, Longitude = 29.830991976245787m },
                    new Station { Name = "Dilovası", Latitude = 40.787591555873554m, Longitude = 29.544313339530788m },
                    new Station { Name = "Gebze", Latitude = 40.802425052012m, Longitude = 29.439258712652727m },
                    new Station { Name = "Gölcük", Latitude = 40.71619307121852m, Longitude = 29.81945482591011m },
                    new Station { Name = "Kandıra", Latitude = 41.07035171657959m, Longitude = 30.152667868734262m },
                    new Station { Name = "Karamürsel", Latitude = 40.69127826409917m, Longitude = 29.61603125848494m },
                    new Station { Name = "Kartepe", Latitude = 40.7536768705129m, Longitude = 30.022951946737017m },
                    new Station { Name = "Körfez", Latitude = 40.776506186755334m, Longitude = 29.737449477805065m },
                    new Station { Name = "İzmit", Latitude = 40.76542858316974m, Longitude = 29.940887296574914m }
               };
                context.Stations.AddRange(stations);
            }

            // 4. Araçlar (Boşsa ekle)
            if (!context.Vehicles.Any())
            {
                context.Vehicles.AddRange(
                    new Vehicle { Name = "Araç 1 (500kg)", CapacityKg = 500, FuelCostPerKm = 1, RentalCost = 0 },
                    new Vehicle { Name = "Araç 2 (750kg)", CapacityKg = 750, FuelCostPerKm = 1, RentalCost = 0 },
                    new Vehicle { Name = "Araç 3 (1000kg)", CapacityKg = 1000, FuelCostPerKm = 1, RentalCost = 0 }
                );
            }

            context.SaveChanges();
        }
    }
}