using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using DatMonAnOnline.API.Hubs;
using DatMonAnOnline.API.Services;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

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
         OnMessageReceived = context =>
    {
        var accessToken =
            context.Request.Query["access_token"];

        var path =
            context.HttpContext.Request.Path;

        if (
            !string.IsNullOrEmpty(accessToken) &&
            path.StartsWithSegments("/hubs/thong-bao")
        )
        {
            context.Token = accessToken;
        }

        return Task.CompletedTask;
    },
        OnTokenValidated = async context =>
        {
            var id = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(id, out var maTaiKhoan) || maTaiKhoan <= 0)
            {
                context.Fail("Token không chứa tài khoản hợp lệ.");
                return;
            }

            // Kiểm tra DB ở mỗi request, không dùng trạng thái cũ trong JWT/cache.
            var db = context.HttpContext.RequestServices
                .GetRequiredService<DatMonAnOnlineContext>();
            var dangHoatDong = await db.Taikhoans
                .AsNoTracking()
                .AnyAsync(t => t.MaTaiKhoan == maTaiKhoan && t.TrangThai == true,
                    context.HttpContext.RequestAborted);

            if (!dangHoatDong)
                context.Fail("Tài khoản không tồn tại hoặc đã bị khóa.");
        },
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.Headers["WWW-Authenticate"] = "Bearer";
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Phiên đăng nhập không hợp lệ, đã hết hạn hoặc tài khoản đã bị khóa. Vui lòng đăng nhập lại."
            });
        },
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
builder.Services.AddMemoryCache();
builder.Services.AddSignalR();
builder.Services.AddScoped<
    IRealtimeNotificationService,
    RealtimeNotificationService
>();
// =========================
// CONTROLLERS + JSON
// =========================

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 64;
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

app.UseCors("AllowFrontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>(
    "/hubs/thong-bao"
);

app.Run();

// Cho phép kiểm thử API qua WebApplicationFactory.
public partial class Program { }
