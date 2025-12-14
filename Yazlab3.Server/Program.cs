using Microsoft.EntityFrameworkCore;
using Yazlab3.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Veritabaný Baðlantýsý
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. CORS Ýzni (Frontend portun 5173 görünüyor, ona izin veriyoruz)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddControllers();
// RouteOptimizer servisini sisteme tanýtýyoruz
builder.Services.AddScoped<Yazlab3.Services.RouteOptimizer>();
// Swagger servislerini ekliyoruz
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Veritabaný Seed Ýþlemi (Otomatik veri ekleme)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
        DbSeeder.Seed(context);
    }
    catch (Exception ex)
    {
        Console.WriteLine("Veritabaný oluþturma hatasý: " + ex.Message);
    }
}

// 3. Middleware Sýralamasý (Burasý Çok Önemli)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



// CORS komutu Authorization'dan ÖNCE gelmeli!
app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.Run();