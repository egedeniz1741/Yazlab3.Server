using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.DTOs; 
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

        
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new LoginResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı adı ve şifre zorunludur."
                });
            }

           
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);

          
            if (user == null || user.Password != request.Password)
            {
                return Unauthorized(new LoginResponseDto
                {
                    Success = false,
                    Message = "Hatalı kullanıcı adı veya şifre!"
                });
            }

           
            return Ok(new LoginResponseDto
            {
                Success = true,
                Message = "Giriş başarılı.",
                Id = user.Id,                
                Role = user.Role.ToLower(),   
                Username = user.Username
            });
        }
    }
}