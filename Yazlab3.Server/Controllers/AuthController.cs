using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.DTOs; // Az önce oluşturduğumuz klasör
using Yazlab3.Models;

namespace Yazlab3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            // 1. Kullanıcı adı ve şifre boş mu kontrol et
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new LoginResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı adı ve şifre zorunludur."
                });
            }

            // 2. Veritabanında kullanıcıyı bul
            // (Büyük/Küçük harf duyarlılığını kaldırmak için ToLower kullanabiliriz ama şimdilik birebir eşleşsin)
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            // 3. Kullanıcı yoksa veya şifre yanlışsa
            if (user == null || user.Password != request.Password)
            {
                return Unauthorized(new LoginResponseDto
                {
                    Success = false,
                    Message = "Hatalı kullanıcı adı veya şifre!"
                });
            }

            // 4. Giriş Başarılı! DTO ile temiz veri dönüyoruz.
            return Ok(new LoginResponseDto
            {
                Success = true,
                Message = "Giriş başarılı.",
                Id = user.Id,                 // <--- KRİTİK NOKTA: ID'yi gönderiyoruz
                Role = user.Role.ToLower(),   // Frontend'de 'admin' kontrolü için küçültüyoruz
                Username = user.Username
            });
        }
    }
}