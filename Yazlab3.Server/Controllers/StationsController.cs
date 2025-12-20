using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.Models;
using Yazlab3.Services; 

namespace Yazlab3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly RouteOptimizer _optimizer; 

    
        public StationsController(AppDbContext context, RouteOptimizer optimizer)
        {
            _context = context;
            _optimizer = optimizer;
        }

    
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Station>>> GetStations()
        {
            return await _context.Stations.ToListAsync();
        }

  
        [HttpGet("{id}")]
        public async Task<ActionResult<Station>> GetStation(int id)
        {
            var station = await _context.Stations.FindAsync(id);
            if (station == null) return NotFound();
            return station;
        }

       
        [HttpGet("matrix")]
        public async Task<ActionResult> GetDistanceMatrix()
        {
            var stations = await _context.Stations.OrderBy(s => s.Name).ToListAsync();
            var matrixData = new List<object>();
            var headers = stations.Select(s => s.Name).ToList();

            foreach (var source in stations)
            {
                var rowDistances = new List<double>();
                foreach (var target in stations)
                {
                    if (source.Id == target.Id)
                    {
                        rowDistances.Add(0);
                    }
                    else
                    {
                        
                        double dist = _optimizer.CalculateDistance(
                            (double)source.Latitude, (double)source.Longitude,
                            (double)target.Latitude, (double)target.Longitude
                        );
                        rowDistances.Add(Math.Round(dist, 1));
                    }
                }

                matrixData.Add(new
                {
                    Name = source.Name,
                    Distances = rowDistances
                });
            }

            return Ok(new { Headers = headers, Rows = matrixData });
        }
     
        [HttpPost]
        public async Task<ActionResult<Station>> PostStation(Station station)
        {
            _context.Stations.Add(station);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetStation", new { id = station.Id }, station);
        }

       
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStation(int id)
        {
            var station = await _context.Stations.FindAsync(id);
            if (station == null) return NotFound("İstasyon bulunamadı.");

            _context.Stations.Remove(station);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}