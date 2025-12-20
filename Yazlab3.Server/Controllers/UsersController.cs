using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;
using Yazlab3.Models;

namespace Yazlab3.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

       
        [HttpPost]
        public async Task<IActionResult> PostUser([FromBody] CreateUserDto userDto)
        {
            if (userDto == null || string.IsNullOrEmpty(userDto.Username) || string.IsNullOrEmpty(userDto.Password))
            {
                return BadRequest(new { message = "Kullanıcı adı ve şifre zorunludur." });
            }

           
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == userDto.Username);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Bu kullanıcı adı zaten kullanılıyor." });
            }

           
            var newUser = new User
            {
                Username = userDto.Username,
                Password = userDto.Password,
                Role = string.IsNullOrEmpty(userDto.Role) ? "user" : userDto.Role
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kullanıcı başarıyla oluşturuldu.", userId = newUser.Id });
        }
       

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel loginData)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginData.Username && u.Password == loginData.Password);

            if (user == null) return Unauthorized(new { message = "Hatalı giriş!" });

          
            string role = user.Username.ToLower() == "admin" ? "admin" : user.Role;

            return Ok(new { id = user.Id, username = user.Username, role = role });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }
    }

  
    public class CreateUserDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
    }

    public class LoginModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}