using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System; // Exception için gerekli
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

        [HttpPost("plan")]
        public async Task<ActionResult> CreatePlan([FromQuery] bool useRentedVehicles = true)
        {
            try
            {
                // Veri tabanı takibini temizle (Hataları önler)
                _context.ChangeTracker.Clear();

                // 1. Bekleyen Kargoları Çek
                var pendingCargos = await _context.CargoRequests
                    .Include(c => c.TargetStation)
                    .Where(c => !c.IsProcessed)
                    .ToListAsync();

                if (!pendingCargos.Any())
                    return Ok(new { Message = "Taşınacak kargo yok." });

                // 2. Mevcut Araçları Çek
                var availableVehicles = await _context.Vehicles
                    .Where(v => !v.IsRented)
                    .OrderByDescending(v => v.CapacityKg)
                    .ToListAsync();

                // İşlenecek kargoları hafızaya al (Wrapper sınıfı ile)
                var processingItems = pendingCargos.Select(c => new ProcessingItem
                {
                    OriginalCargoId = c.Id,
                    OriginalCargo = c,
                    RemainingWeight = c.WeightKg
                }).ToList();

                double depotLat = 40.7654;
                double depotLng = 29.9408;
                int routesCreated = 0;

                // --- AŞAMA 1: MEVCUT FİLO ---
                foreach (var vehicle in availableVehicles)
                {
                    if (!processingItems.Any()) break;

                    // Aracı doldur
                    var loadPlan = FillVehicle(processingItems, vehicle.CapacityKg);

                    if (loadPlan.Any())
                    {
                        // Rotayı kaydet
                        await SaveRouteToDb(vehicle, loadPlan, depotLat, depotLng);
                        routesCreated++;

                        // Tamamen biten kargoları listeden sil
                        processingItems.RemoveAll(x => x.RemainingWeight <= 0.1);
                    }
                }

                // --- AŞAMA 2: KİRALIK ARAÇLAR ---
                if (useRentedVehicles && processingItems.Any())
                {
                    int rentCounter = 1;
                    while (processingItems.Any())
                    {
                        double rentalCap = 500; // Sabit Kapasite

                        // Kiralık aracı doldur
                        var loadPlan = FillVehicle(processingItems, rentalCap);

                        if (!loadPlan.Any()) break; // Sonsuz döngü koruması

                        // Kiralık Araç Oluştur
                        var rentalVehicle = new Vehicle
                        {
                            Name = $"Kiralık Araç {rentCounter}",
                            CapacityKg = (int)rentalCap,
                            FuelCostPerKm = 1,
                            IsRented = true,
                            RentalCost = 200
                        };
                        _context.Vehicles.Add(rentalVehicle);
                        await _context.SaveChangesAsync();

                        // Rotayı kaydet
                        await SaveRouteToDb(rentalVehicle, loadPlan, depotLat, depotLng);
                        routesCreated++;

                        // Bitenleri sil
                        processingItems.RemoveAll(x => x.RemainingWeight <= 0.1);
                        rentCounter++;
                    }
                }

                // --- AŞAMA 3: DURUM GÜNCELLEME ---
                // Eğer bir kargonun ağırlığı tamamen bittiyse "IsProcessed = true" yap
                var allOriginalIds = pendingCargos.Select(c => c.Id).ToList();
                var remainingIds = processingItems.Select(p => p.OriginalCargoId).ToList();

                foreach (var cargo in pendingCargos)
                {
                    // Eğer kalanlar listesinde yoksa, işi bitmiştir.
                    if (!remainingIds.Contains(cargo.Id))
                    {
                        cargo.IsProcessed = true;
                        _context.Entry(cargo).State = EntityState.Modified;
                    }
                }
                await _context.SaveChangesAsync();

                return Ok(new { Message = $"{routesCreated} adet rota başarıyla oluşturuldu." });
            }
            catch (Exception ex)
            {
                // Hata olursa patlamak yerine mesaj dön
                return StatusCode(500, new { Message = "Hata oluştu: " + ex.Message, Detail = ex.StackTrace });
            }
        }

        // --- YARDIMCI METOTLAR ---

        // Araca sığacak yükleri seçen ve gerekirse bölen algoritma
        private List<ProcessingItem> FillVehicle(List<ProcessingItem> items, double vehicleCapacity)
        {
            var selected = new List<ProcessingItem>();
            double currentLoad = 0;

            // Büyükten küçüğe sırala (Daha iyi doluluk için)
            // Not: Referans üzerinden çalıştığımız için items listesindeki nesneler güncellenir
            var sortedCandidates = items.OrderByDescending(i => i.RemainingWeight).ToList();

            foreach (var item in sortedCandidates)
            {
                double spaceLeft = vehicleCapacity - currentLoad;

                if (spaceLeft <= 0.1) break; // Yer kalmadı

                // Ne kadar yükleyebiliriz?
                // Ya tamamını alırız ya da kalan boşluk kadarını
                double amountToTake = Math.Min(item.RemainingWeight, spaceLeft);

                // Yükleme yap
                item.LoadedAmountForCurrentRide = amountToTake; // Bu seferlik yüklenen miktar
                item.RemainingWeight -= amountToTake;           // Kalan miktar güncellendi

                selected.Add(item);
                currentLoad += amountToTake;
            }

            return selected;
        }

        private async Task SaveRouteToDb(Vehicle vehicle, List<ProcessingItem> items, double startLat, double startLng)
        {
            // Rota sıralaması için orijinal kargo nesnelerini listeye çevir
            var cargoRequests = items.Select(i => i.OriginalCargo).ToList();

            // TSP Algoritması ile en kısa yolu bul
            var optimizedRoute = _optimizer.OptimizeRoute(cargoRequests, startLat, startLng);

            // Mesafeyi Hesapla
            double totalDist = 0;
            double currentLat = startLat;
            double currentLng = startLng;

            foreach (var cargo in optimizedRoute)
            {
                if (cargo.TargetStation != null)
                {
                    double tLat = (double)cargo.TargetStation.Latitude;
                    double tLng = (double)cargo.TargetStation.Longitude;
                    totalDist += _optimizer.CalculateDistance(currentLat, currentLng, tLat, tLng);
                    currentLat = tLat;
                    currentLng = tLng;
                }
            }
            // Depoya dönüş
            totalDist += _optimizer.CalculateDistance(currentLat, currentLng, startLat, startLng);

            // Sefer Kaydı
            var deliveryRoute = new DeliveryRoute
            {
                VehicleId = vehicle.Id,
                RouteDate = DateTime.Now,
                TotalDistanceKm = (decimal)totalDist,
                TotalCost = vehicle.RentalCost + (decimal)totalDist * vehicle.FuelCostPerKm
            };
            _context.DeliveryRoutes.Add(deliveryRoute);
            await _context.SaveChangesAsync();

            // Durak Kaydı
            int order = 1;
            foreach (var cargo in optimizedRoute)
            {
                // Listeden bu kargo için ayrılan yük miktarını bul
                var itemData = items.First(i => i.OriginalCargoId == cargo.Id);

                var stop = new RouteStop
                {
                    DeliveryRouteId = deliveryRoute.Id,
                    StationId = cargo.TargetStationId,
                    VisitOrder = order++,
                    LoadedCargoWeight = itemData.LoadedAmountForCurrentRide // PARÇALANMIŞ AĞIRLIK BURAYA
                };
                _context.RouteStops.Add(stop);
            }
            await _context.SaveChangesAsync();
        }
        // GET: api/Optimization/routes
        // Bu etiket ÇOK ÖNEMLİ. Frontend tam olarak bu adresi arıyor.
        [HttpGet("routes")]
        public async Task<ActionResult> GetRoutes()
        {
            var routes = await _context.DeliveryRoutes
                .Include(r => r.Vehicle)
                .Include(r => r.Stops)
                    .ThenInclude(s => s.Station)
                .OrderByDescending(r => r.RouteDate)
                .ToListAsync();

            // Eğer hiç rota yoksa boş liste dön (404 dönme!)
            if (routes == null) return Ok(new List<DeliveryRoute>());

            return Ok(routes);
        }
    }

    // --- YARDIMCI SINIF (Class Dışında Tanımlandı) ---
    public class ProcessingItem
    {
        public int OriginalCargoId { get; set; }
        public CargoRequest OriginalCargo { get; set; }
        public double RemainingWeight { get; set; } // Hala taşınması gereken (örn: 900 -> 400)
        public double LoadedAmountForCurrentRide { get; set; } // O anki araca yüklenen (örn: 500)
    }
}