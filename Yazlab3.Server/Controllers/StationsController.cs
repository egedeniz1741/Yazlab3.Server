using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.Models;

namespace Yazlab3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/stations
        // Tüm ilçeleri getirir (Harita ve Selectbox için)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Station>>> GetStations()
        {
            return await _context.Stations.ToListAsync();
        }

        // POST: api/stations
        // Yeni istasyon ekle (Admin paneli için)
        [HttpPost]
        public async Task<ActionResult<Station>> PostStation(Station station)
        {
            _context.Stations.Add(station);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetStations", new { id = station.Id }, station);
        }
    }
}