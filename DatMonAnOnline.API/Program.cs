using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =========================
// DATABASE
// =========================

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<DatMonAnOnlineContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);

// =========================
// JWT AUTHENTICATION
// =========================

const string jwtSecret = "DayLaMotChuoiBaoMatRatDaiChoJwtToken123456";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        JwtBearerDefaults.AuthenticationScheme;

    options.DefaultChallengeScheme =
        JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,

        ValidateLifetime = true,

        ValidateIssuerSigningKey = true,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSecret)
        ),

        ClockSkew = TimeSpan.FromSeconds(30)
    };

    // Hiển thị lỗi JWT trong Terminal khi authentication thất bại
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine("=================================");
            Console.WriteLine("JWT AUTH ERROR:");
            Console.WriteLine(context.Exception.Message);
            Console.WriteLine("=================================");

            return Task.CompletedTask;
        }
    };
});

// =========================
// AUTHORIZATION
// =========================

builder.Services.AddAuthorization();

// =========================
// CONTROLLERS + JSON
// =========================

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// =========================
// OPENAPI
// =========================

builder.Services.AddOpenApi();

var app = builder.Build();

// =========================
// DEVELOPMENT
// =========================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); 

    app.MapScalarApiReference(options =>
    {
        options.WithTitle("DatMonAnOnline API");
        options.WithTheme(ScalarTheme.DeepSpace);
    });
}

// =========================
// HTTP PIPELINE
// =========================

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();