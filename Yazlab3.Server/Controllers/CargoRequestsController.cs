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

        // GET: api/cargorequests
        // Admin tüm talepleri görsün
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CargoRequest>>> GetCargoRequests()
        {
            // İlişkili olduğu User ve TargetStation verilerini de (Include) getiriyoruz
            return await _context.CargoRequests
                .Include(c => c.User)
                .Include(c => c.TargetStation)
                .ToListAsync();
        }

        // POST: api/cargorequests
        // Kullanıcı yeni talep oluşturur
        [HttpPost]
        public async Task<ActionResult<CargoRequest>> PostCargoRequest(CargoRequest request)
        {
            // Basit bir doğrulama: Olmayan istasyona gönderemesin
            var station = await _context.Stations.FindAsync(request.TargetStationId);
            if (station == null)
            {
                return BadRequest("Geçersiz istasyon seçimi.");
            }

            // Tarih ataması
            request.CreatedDate = DateTime.Now;

            // Kullanıcı ID'si şimdilik manuel gelecek (Auth ekleyince otomatikleştireceğiz)
            // Eğer User ID gönderilmediyse geçici olarak Admin'e (Id=1) atayalım test için
            if (request.UserId == 0) request.UserId = 1;

            _context.CargoRequests.Add(request);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCargoRequests", new { id = request.Id }, request);
        }
    }
}