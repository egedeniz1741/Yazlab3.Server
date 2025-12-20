using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.Models;
using Yazlab3.Services;
using System.Globalization;

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
               
                _context.ChangeTracker.Clear();

           
                var pendingCargos = await _context.CargoRequests
                    .Include(c => c.TargetStation)
                    .Where(c => !c.IsProcessed)
                    .ToListAsync();

                if (!pendingCargos.Any()) return Ok(new { Message = "Taşınacak kargo yok." });

              
                var availableVehicles = await _context.Vehicles
                    .Where(v => !v.IsRented)
                    .OrderByDescending(v => v.CapacityKg)
                    .ToListAsync();

              
                var processingItems = pendingCargos.Select(c => new ProcessingItem
                {
                    OriginalCargoId = c.Id,
                    OriginalCargo = c,
                    RemainingWeight = c.WeightKg
                }).ToList();

              
                double depotLat = 0;
                double depotLng = 0;
                int routesCreated = 0;

               
                foreach (var vehicle in availableVehicles)
                {
                    if (!processingItems.Any()) break;

                    var loadPlan = FillVehicle(processingItems, vehicle.CapacityKg);

                    if (loadPlan.Any())
                    {
                        await SaveRouteToDb(vehicle, loadPlan, depotLat, depotLng);
                        routesCreated++;

                       
                        processingItems.RemoveAll(x => x.RemainingWeight <= 0.1);
                    }
                }

              
                if (useRentedVehicles && processingItems.Any())
                {
                    int rentCounter = 1;
                    while (processingItems.Any())
                    {
                        var loadPlan = FillVehicle(processingItems, 500); 

                        if (!loadPlan.Any()) break;

                      
                        var rentalVehicle = new Vehicle
                        {
                            Name = $"Kiralık Araç {rentCounter}",
                            CapacityKg = 500,
                            FuelCostPerKm = 1, 
                            IsRented = true,
                            RentalCost = 200 
                        };

                        _context.Vehicles.Add(rentalVehicle);
                        await _context.SaveChangesAsync(); 

                        await SaveRouteToDb(rentalVehicle, loadPlan, depotLat, depotLng);
                        routesCreated++;

                        processingItems.RemoveAll(x => x.RemainingWeight <= 0.1);
                        rentCounter++;
                    }
                }

                return Ok(new { Message = $"{routesCreated} adet rota oluşturuldu." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Hata: " + ex.Message });
            }
        }

     
        [HttpGet("routes")]
        public async Task<ActionResult> GetRoutes([FromQuery] bool showHistory = false)
        {
            var query = _context.DeliveryRoutes
                .Include(r => r.Vehicle)
                .Include(r => r.Stops).ThenInclude(s => s.Station)
                .OrderByDescending(r => r.RouteDate)
                .AsQueryable();

            if (showHistory)
                query = query.Where(r => r.IsArchived);
            else
                query = query.Where(r => !r.IsArchived);

            var routes = await query.ToListAsync();

            var result = new List<object>();

            foreach (var route in routes)
            {
                var stopsData = new List<object>();

                foreach (var stop in route.Stops.OrderBy(s => s.VisitOrder))
                {
                   
                    var customers = await _context.CargoRequests
                        .Include(c => c.User)
                        .Where(c => c.DeliveryRouteId == route.Id && c.TargetStationId == stop.StationId)
                        .Select(c => c.User.Username)
                        .Distinct()
                        .ToListAsync();

                    stopsData.Add(new
                    {
                        stop.Id,
                        stop.VisitOrder,
                        stop.LoadedCargoWeight,
                        StationName = stop.Station.Name,
                        Station = stop.Station,
                        Customers = customers
                    });
                }

                result.Add(new
                {
                    route.Id,
                    route.TotalDistanceKm,
                    route.TotalCost,
                    Vehicle = route.Vehicle,
                    Stops = stopsData,
                    RouteDate = route.RouteDate
                });
            }

            return Ok(result);
        }

        
        [HttpGet("history-groups")]
        public async Task<ActionResult> GetHistoryGroups()
        {
         
            var rawRoutes = await _context.DeliveryRoutes
                .Where(r => r.IsArchived)
                .Select(r => r.RouteDate)
                .ToListAsync();

           
            var groups = rawRoutes
                .GroupBy(r => r) 
                .Select(g => new
                {
                    DateId = g.Key.ToString("yyyy-MM-dd HH:mm:ss"),
                    DisplayName = $"Arşiv - {g.Key.ToString("dd.MM.yyyy HH:mm:ss")}",
                    RouteCount = g.Count()
                })
                .OrderByDescending(g => g.DateId)
                .Distinct()
                .ToList();

  
            var uniqueGroups = groups
                .GroupBy(g => g.DateId)
                .Select(g => g.First())
                .ToList();

            return Ok(uniqueGroups);
        }

       
        [HttpGet("history-by-date")]
        public async Task<ActionResult> GetHistoryByDate([FromQuery] string dateStr)
        {
            var routes = await _context.DeliveryRoutes
                .Include(r => r.Vehicle)
                .Include(r => r.Stops).ThenInclude(s => s.Station)
                .Where(r => r.IsArchived)
                .ToListAsync();

          
            var filteredRoutes = routes
                .Where(r => r.RouteDate.ToString("yyyy-MM-dd HH:mm:ss") == dateStr)
                .OrderBy(r => r.Vehicle.Name)
                .ToList();

            var result = new List<object>();

            foreach (var route in filteredRoutes)
            {
                var stopsData = new List<object>();
                foreach (var stop in route.Stops.OrderBy(s => s.VisitOrder))
                {
                  
                    var customers = await _context.CargoRequests
                        .Include(c => c.User)
                        .Where(c => c.DeliveryRouteId == route.Id && c.TargetStationId == stop.StationId)
                        .Select(c => c.User.Username)
                        .Distinct()
                        .ToListAsync();

                    stopsData.Add(new
                    {
                        stop.Id,
                        stop.VisitOrder,
                        stop.LoadedCargoWeight,
                        StationName = stop.Station.Name,
                        Station = stop.Station,
                        Customers = customers
                    });
                }
                result.Add(new { route.Id, route.TotalDistanceKm, route.TotalCost, Vehicle = route.Vehicle, Stops = stopsData, RouteDate = route.RouteDate });
            }

            return Ok(result);
        }

        

        private List<ProcessingItem> FillVehicle(List<ProcessingItem> items, double capacity)
        {
            var selected = new List<ProcessingItem>();
            double currentLoad = 0;

            
            foreach (var item in items.OrderByDescending(i => i.RemainingWeight))
            {
                double spaceLeft = capacity - currentLoad;
                if (spaceLeft <= 0.1) break; 

                double take = Math.Min(item.RemainingWeight, spaceLeft);

                item.LoadedAmountForCurrentRide = take;
                item.RemainingWeight -= take;

                selected.Add(item);
                currentLoad += take;
            }
            return selected;
        }

        private async Task SaveRouteToDb(Vehicle vehicle, List<ProcessingItem> items, double startLat, double startLng)
        {
          
            double umuttepeLat = 40.821768;
            double umuttepeLng = 29.923476;

            var cargoRequests = items.Select(i => i.OriginalCargo).ToList();

     
            var optimizedRoute = _optimizer.OptimizeRoute(cargoRequests, 0, 0);

            double totalDist = 0;

         
            for (int i = 0; i < optimizedRoute.Count - 1; i++)
            {
                var s1 = optimizedRoute[i].TargetStation;
                var s2 = optimizedRoute[i + 1].TargetStation;
                totalDist += _optimizer.CalculateDistance((double)s1.Latitude, (double)s1.Longitude, (double)s2.Latitude, (double)s2.Longitude);
            }

          
            if (optimizedRoute.Count > 0)
            {
                var last = optimizedRoute.Last().TargetStation;
                totalDist += _optimizer.CalculateDistance((double)last.Latitude, (double)last.Longitude, umuttepeLat, umuttepeLng);
            }

      
            var deliveryRoute = new DeliveryRoute
            {
                VehicleId = vehicle.Id,
                RouteDate = DateTime.Now,
                TotalDistanceKm = (decimal)totalDist,
                TotalCost = vehicle.RentalCost + (decimal)totalDist * vehicle.FuelCostPerKm,
                IsArchived = false
            };

            _context.DeliveryRoutes.Add(deliveryRoute);
            await _context.SaveChangesAsync(); 

           
            int order = 1;
            foreach (var cargo in optimizedRoute)
            {
                var itemData = items.First(i => i.OriginalCargoId == cargo.Id);

            
                _context.RouteStops.Add(new RouteStop
                {
                    DeliveryRouteId = deliveryRoute.Id,
                    StationId = cargo.TargetStationId,
                    VisitOrder = order++,
                    LoadedCargoWeight = itemData.LoadedAmountForCurrentRide
                });

              
                var dbCargo = await _context.CargoRequests.FindAsync(cargo.Id);
                if (dbCargo != null)
                {
                    dbCargo.IsProcessed = true;
                    dbCargo.DeliveryRouteId = deliveryRoute.Id; 
                    _context.Entry(dbCargo).State = EntityState.Modified;
                }
            }
            await _context.SaveChangesAsync();
        }
    }

  
    public class ProcessingItem
    {
        public int OriginalCargoId { get; set; }
        public CargoRequest OriginalCargo { get; set; }
        public double RemainingWeight { get; set; }
        public double LoadedAmountForCurrentRide { get; set; }
    }
}