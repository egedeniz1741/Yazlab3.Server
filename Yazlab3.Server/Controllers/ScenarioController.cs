using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using Yazlab3.Data;
using Yazlab3.Models;

namespace Yazlab3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScenarioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ScenarioController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/scenario/1
        [HttpPost("1")]
        public async Task<IActionResult> LoadScenario1()
        {
      
            var stations = await _context.Stations.ToListAsync();

            // PDF Senaryo 1 Verileri
            var scenarioData = new List<dynamic>
            {
                new { Name = "Başiskele", Count = 10, Weight = 120 },
                new { Name = "Çayırova", Count = 8, Weight = 80 },
                new { Name = "Darıca", Count = 15, Weight = 200 },
                new { Name = "Derince", Count = 10, Weight = 150 },
                new { Name = "Dilovası", Count = 12, Weight = 180 },
                new { Name = "Gebze", Count = 5, Weight = 70 },
                new { Name = "Gölcük", Count = 7, Weight = 90 },
                new { Name = "Kandıra", Count = 6, Weight = 60 },
                new { Name = "Karamürsel", Count = 9, Weight = 110 },
                new { Name = "Kartepe", Count = 11, Weight = 130 },
                new { Name = "Körfez", Count = 6, Weight = 75 },
                new { Name = "İzmit", Count = 14, Weight = 160 }
            };

            int userId = 1; // Varsayılan Admin kullanıcısı (veya ilk user)
            if (_context.Users.Any()) userId = _context.Users.First().Id;

            foreach (var item in scenarioData)
            {
                var station = stations.FirstOrDefault(s => s.Name == item.Name);
                if (station != null)
                {
                    _context.CargoRequests.Add(new CargoRequest
                    {
                        UserId = userId,
                        TargetStationId = station.Id,
                        CargoCount = item.Count,
                        WeightKg = item.Weight,
                        DeliveryDate = DateTime.Now,
                        IsProcessed = false // Henüz işlenmedi, algoritmaya girecek
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Senaryo 1 verileri başarıyla yüklendi! Şimdi optimizasyonu çalıştırabilirsin.");
        }
        // ... (Mevcut LoadScenario1 ve ResetSystem metodları kalsın) ...

        // SENARYO 2: (PDF Sayfa 3'teki Tablo)
        [HttpPost("2")]
        public async Task<IActionResult> LoadScenario2()
        {
            var data = new List<dynamic>
            {
                new { Name = "Başiskele", Count = 40, Weight = 200 },
                new { Name = "Çayırova", Count = 35, Weight = 175 },
                new { Name = "Darıca", Count = 10, Weight = 150 },
                new { Name = "Derince", Count = 5, Weight = 100 },
                new { Name = "Gebze", Count = 8, Weight = 120 },
                new { Name = "İzmit", Count = 20, Weight = 160 }
                // Diğer ilçeler 0 olduğu için eklemiyoruz
            };
            await AddScenarioData(data);
            return Ok("Senaryo 2 yüklendi (Toplam 905 kg).");
        }

        // SENARYO 3: (Ağırlıklı olarak Gebze, Dilovası - Kapasite Aşımı Testi)
        [HttpPost("3")]
        public async Task<IActionResult> LoadScenario3()
        {
            var data = new List<dynamic>
            {
                new { Name = "Çayırova", Count = 3, Weight = 700 },
                new { Name = "Dilovası", Count = 4, Weight = 800 },
                new { Name = "Gebze", Count = 5, Weight = 900 },
                new { Name = "İzmit", Count = 5, Weight = 300 }
            };
            await AddScenarioData(data);
            return Ok("Senaryo 3 yüklendi (Toplam 2700 kg - Kiralık Araç Gerekecek!).");
        }

        // SENARYO 4: (Az sayıda kargo, maliyet testi)
        [HttpPost("4")]
        public async Task<IActionResult> LoadScenario4()
        {
            var data = new List<dynamic>
            {
                new { Name = "Başiskele", Count = 30, Weight = 300 },
                new { Name = "Gölcük", Count = 15, Weight = 220 },
                new { Name = "Kandıra", Count = 5, Weight = 250 },
                new { Name = "Karamürsel", Count = 20, Weight = 180 },
                new { Name = "Kartepe", Count = 10, Weight = 200 },
                new { Name = "Körfez", Count = 8, Weight = 400 }
            };
            await AddScenarioData(data);
            return Ok("Senaryo 4 yüklendi (Toplam 1550 kg).");
        }

        // Yardımcı Metot (Kod tekrarını önlemek için)
        private async Task AddScenarioData(List<dynamic> scenarioData)
        {
            var stations = await _context.Stations.ToListAsync();
            int userId = 1;
            if (_context.Users.Any()) userId = _context.Users.First().Id;

            foreach (var item in scenarioData)
            {
                var station = stations.FirstOrDefault(s => s.Name == item.Name);
                if (station != null)
                {
                    _context.CargoRequests.Add(new CargoRequest
                    {
                        UserId = userId,
                        TargetStationId = station.Id,
                        CargoCount = item.Count,
                        WeightKg = item.Weight,
                        DeliveryDate = DateTime.Now,
                        IsProcessed = false
                    });
                }
            }
            await _context.SaveChangesAsync();
        }
        // ... LoadScenario1 metodu üstte kalsın ...

        // DELETE: api/scenario/reset
        [HttpDelete("reset")]
        public async Task<IActionResult> ResetSystem()
        {
            // 1. Önce Durakları Sil (En alt detay)
            var stops = await _context.RouteStops.ToListAsync();
            _context.RouteStops.RemoveRange(stops);

            // 2. Rotaları Sil
            var routes = await _context.DeliveryRoutes.ToListAsync();
            _context.DeliveryRoutes.RemoveRange(routes);

            // 3. Kargo Taleplerini Sil
            var requests = await _context.CargoRequests.ToListAsync();
            _context.CargoRequests.RemoveRange(requests);

            // 4. SADECE KİRALIK ARAÇLARI SİL (DÜZELTİLEN KISIM)
            // Eski kodda hepsini siliyorduk, bu yüzden araç kalmıyordu.
            // Şimdi sadece 'IsRented = true' olanları siliyoruz.
            var rentedVehicles = await _context.Vehicles
                                      .Where(v => v.IsRented == true)
                                      .ToListAsync();
            _context.Vehicles.RemoveRange(rentedVehicles);

            await _context.SaveChangesAsync();
            return Ok("Sistem sıfırlandı. Ana araçlar korundu, kiralıklar ve kargolar silindi.");
        }
    }
}