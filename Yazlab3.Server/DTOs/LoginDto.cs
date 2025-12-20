namespace Yazlab3.DTOs
{
    
    public class LoginRequestDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

   
    public class LoginResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int Id { get; set; }      
        public string Role { get; set; } 
        public string Username { get; set; }
    }
}