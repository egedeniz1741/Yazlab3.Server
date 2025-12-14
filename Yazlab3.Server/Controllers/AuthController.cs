// Controllers/AuthController.cs (ASP.NET Core API)

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // DbContext işlemleri için gerekli
using System.Threading.Tasks;
using Yazlab3.Data;                 // AppDbContext'e erişim için
using Yazlab3.Models;                // User modeline erişim için

namespace Yazlab3.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        // Dependency Injection ile AppDbContext'i buraya alıyoruz.
        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // Basit Kimlik Doğrulama Modeli (Bu kısım zaten vardı, aynı kalır)
        public class LoginModel
        {
            public string Username { get; set; }
            public string Password { get; set; }
        }

        // Giriş işlemi
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { success = false, message = "Kullanıcı adi ve sifre zorunludur." });
            }

            // 1. Veri tabanında kullanıcıyı ara
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == model.Username);

            // 2. Kullanıcı kontrolü ve şifre doğrulaması
            // (Güvenlik nedeniyle şifreler hash'lenmelidir, ancak burada düz metin karşılaştırması yapılmıştır.)
            if (user == null || user.Password != model.Password)
            {
                // Giriş başarısız
                return Unauthorized(new { success = false, message = "Kullanici adi veya sifre hatali." });
            }

            // 3. Giriş başarılı, rol bilgisini döndür
            // Rolü küçük harfe çeviriyoruz, React tarafındaki 'admin' ve 'user' karşılaştırmasına uyması için.
            return Ok(new
            {
                success = true,
                role = user.Role.ToLower(),
                message = $"{user.Role} girisi başarıli."
            });
        }
    }
}