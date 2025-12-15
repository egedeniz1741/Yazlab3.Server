namespace Yazlab3.DTOs
{
    // Giriş yaparken istenecek veriler
    public class LoginRequestDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    // Giriş başarılı olunca dönülecek veriler
    public class LoginResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int Id { get; set; }      // Kullanıcı ID'si (Kargo eklerken lazım)
        public string Role { get; set; } // Admin mi User mı?
        public string Username { get; set; }
    }
}