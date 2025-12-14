using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.Models;
using Yazlab3.Services;

namespace Yazlab3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OptimizationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly RouteOptimizer _optimizer;

        public OptimizationController(AppDbContext context, RouteOptimizer optimizer)
        {
            _context = context;
            _optimizer = optimizer;
        }

        // POST: api/optimization/plan
        // Bu metod sadece planlama yapar, veritabanını kalıcı değiştirmez (Simülasyon)
        [HttpPost("plan")]
        public async Task<ActionResult> CreatePlan([FromQuery] bool useRentedVehicles = true)
        {
            // 1. Bekleyen (İşlenmemiş) Kargoları Çek
            var pendingCargos = await _context.CargoRequests
                .Include(c => c.TargetStation)
                .Where(c => !c.IsProcessed)
                .ToListAsync();

            if (!pendingCargos.Any())
            {
                return Ok("Taşınacak kargo bulunamadı.");
            }

            // 2. Mevcut Araçları Çek ve Kapasiteye Göre Sırala (Büyük araç önce dolsun)
            // PDF: Başlangıçta 3 araç var (500, 750, 1000 kg)
            var availableVehicles = await _context.Vehicles
                .Where(v => !v.IsRented)
                .OrderByDescending(v => v.CapacityKg)
                .ToListAsync();

            var planResults = new List<VehiclePlanResult>();
            var remainingCargos = new List<CargoRequest>(pendingCargos);

            // 3. MEVCUT ARAÇLARI DOLDUR (Knapsack Algoritması)
            foreach (var vehicle in availableVehicles)
            {
                if (!remainingCargos.Any()) break;

                // Algoritmayı çağır: Bu araca sığacak en optimum yükleri bul
                var selectedCargos = _optimizer.KnapsackLoader(remainingCargos, vehicle.CapacityKg);

                if (selectedCargos.Any())
                {
                    planResults.Add(new VehiclePlanResult
                    {
                        VehicleName = vehicle.Name,
                        Capacity = vehicle.CapacityKg,
                        IsRented = false,
                        LoadedCargoCount = selectedCargos.Count,
                        TotalWeight = selectedCargos.Sum(c => c.WeightKg),
                        Cargos = selectedCargos
                    });

                    // Seçilenleri kalan listesinden çıkar
                    foreach (var cargo in selectedCargos)
                    {
                        remainingCargos.Remove(cargo);
                    }
                }
            }

            // 4. KİRALIK ARAÇ MANTIĞI (Sınırsız Araç Problemi)
            // PDF Madde 31: Araç sayısı yetmezse araç kiralanabilir.
            if (useRentedVehicles && remainingCargos.Any())
            {
                int rentCounter = 1;
                while (remainingCargos.Any())
                {
                    // PDF Madde 40: Kiralık araç 500kg kapasiteli ve maliyeti 200 birim
                    var rentedVehicleCap = 500;

                    var selectedForRent = _optimizer.KnapsackLoader(remainingCargos, rentedVehicleCap);

                    if (!selectedForRent.Any()) break; // Hata önleyici

                    planResults.Add(new VehiclePlanResult
                    {
                        VehicleName = $"Kiralık Araç {rentCounter}",
                        Capacity = rentedVehicleCap,
                        IsRented = true,
                        RentalCost = 200, // PDF'teki sabit maliyet
                        LoadedCargoCount = selectedForRent.Count,
                        TotalWeight = selectedForRent.Sum(c => c.WeightKg),
                        Cargos = selectedForRent
                    });

                    foreach (var cargo in selectedForRent)
                    {
                        remainingCargos.Remove(cargo);
                    }
                    rentCounter++;
                }
            }

            return Ok(new
            {
                Message = remainingCargos.Any() ? "Tüm kargolar sığmadı!" : "Tüm kargolar planlandı.",
                RemainingCargoCount = remainingCargos.Count,
                Plan = planResults
            });
        }
    }

    // Sonucu güzel göstermek için yardımcı sınıf (DTO)
    public class VehiclePlanResult
    {
        public string VehicleName { get; set; }
        public int Capacity { get; set; }
        public bool IsRented { get; set; }
        public decimal RentalCost { get; set; }
        public int LoadedCargoCount { get; set; }
        public double TotalWeight { get; set; }
        public List<CargoRequest> Cargos { get; set; }
    }
}