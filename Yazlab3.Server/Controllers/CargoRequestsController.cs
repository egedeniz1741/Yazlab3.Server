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
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserRequests(int userId)
        {
            var requests = await _context.CargoRequests
                .Include(c => c.TargetStation)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.DeliveryDate) // En yeniden eskiye
                .ToListAsync();

            // Kargoların hangi araçta olduğunu bulmak için DeliveryRoutes ile eşleştirmemiz lazım.
            // Bu biraz maliyetli bir sorgu ama kullanıcı panelinde detay görmek için şart.
            // Basit yöntem: Her kargo için RouteStop tablosuna gidip "Bu istasyona giden rota var mı?" diye bakacağız.

            // NOT: Daha performanslı olması için CargoRequest tablosuna "AssignedRouteId" eklenebilirdi.
            // Ancak mevcut yapıyı bozmadan şöyle bir DTO dönelim:

            var result = new List<object>();

            foreach (var req in requests)
            {
                string status = "Beklemede";
                string vehicleInfo = "-";

                if (req.IsProcessed)
                {
                    status = "Yolda / Planlandı";
                    // Hangi araçta olduğunu bulmaya çalışalım (Opsiyonel, karmaşıksa atlayabiliriz)
                    // Şimdilik sadece statü gösterelim, yeterli olacaktır.
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

            // Sadece "İşlenmemiş" (Yola Çıkmamış) kargolar iptal edilebilir
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