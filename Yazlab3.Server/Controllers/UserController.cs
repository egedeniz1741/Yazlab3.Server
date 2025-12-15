// Controllers/UserController.cs (ASP.NET Core API)

using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Yazlab3.Data;
using Yazlab3.Models;
using Microsoft.EntityFrameworkCore;

// *** DİKKAT: Gerçek uygulamada, bu Controller [Authorize(Roles = "Admin")] ile korunmalıdır! ***
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    // Kullanıcı Ekleme Modeli
    public class CreateUserModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } // "Admin" veya "User"
    }

    // POST: api/User (Yeni kullanıcı ekle)
    // Sadece Admin rolünün bu uç noktayı kullanabilmesi gerekir.
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserModel model)
    {
        // 1. Zorunlu Alan Kontrolü
        if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password))
        {
            return BadRequest(new { message = "Kullanıcı adı ve şifre gereklidir." });
        }

        // 2. Kullanıcı Adı Tekrarlama Kontrolü
        if (await _context.Users.AnyAsync(u => u.Username == model.Username))
        {
            return Conflict(new { message = "Bu kullanıcı adı zaten sistemde mevcut." });
        }

        // 3. Yeni Kullanıcı Nesnesini Oluşturma
        var newUser = new User
        {
            Username = model.Username,
            Password = model.Password, // Gerçek projede burası hash'lenmelidir!
            Role = model.Role,
            // CreatedDate'i veritabanı veya uygulama seviyesinde otomatik olarak ekliyoruz
            CreatedDate = DateTime.UtcNow // UTC saati kullanmak en iyisidir
        };

        // 4. Veritabanına Ekleme
        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // 5. Başarılı Cevap
        return StatusCode(201, new
        {
            message = $"Kullanıcı ({model.Username}) başarıyla eklendi.",
            id = newUser.Id
        });
    }
}