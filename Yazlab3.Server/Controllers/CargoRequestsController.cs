using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.Models;

namespace Yazlab3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CargoRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CargoRequestsController(AppDbContext context)
        {
            _context = context;
        }

   
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CargoRequest>>> GetCargoRequests()
        {
          
            return await _context.CargoRequests
                .Include(c => c.User)
                .Include(c => c.TargetStation)
                .ToListAsync();
        }

       
        [HttpPost]
        public async Task<ActionResult<CargoRequest>> PostCargoRequest(CargoRequest request)
        {
          
            var station = await _context.Stations.FindAsync(request.TargetStationId);
            if (station == null)
            {
                return BadRequest("Geçersiz istasyon seçimi.");
            }

        
            request.CreatedDate = DateTime.Now;

        
            if (request.UserId == 0) request.UserId = 1;

            _context.CargoRequests.Add(request);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCargoRequests", new { id = request.Id }, request);
        }
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserRequests(int userId)
        {
            var requests = await _context.CargoRequests
                .Include(c => c.TargetStation)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.DeliveryDate) 
                .ToListAsync();

       

            var result = new List<object>();

            foreach (var req in requests)
            {
                string status = "Beklemede";
                string vehicleInfo = "-";

                if (req.IsProcessed)
                {
                    status = "Yolda / Planlandı";
                 
                }

                result.Add(new
                {
                    req.Id,
                    TargetStation = req.TargetStation?.Name ?? "Bilinmiyor",
                    req.CargoCount,
                    req.WeightKg,
                    Date = req.DeliveryDate.ToString("dd.MM.yyyy HH:mm"),
                    Status = status
                });
            }

            return Ok(result);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelRequest(int id)
        {
            var cargoRequest = await _context.CargoRequests.FindAsync(id);
            if (cargoRequest == null) return NotFound();

        
            if (cargoRequest.IsProcessed)
            {
                return BadRequest(new { message = "Bu kargo yola çıktığı için iptal edilemez!" });
            }

            _context.CargoRequests.Remove(cargoRequest);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Talep başarıyla iptal edildi." });
        }
    }
}