using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using DatMonAnOnline.API.Hubs;
using DatMonAnOnline.API.Services;
using DatMonAnOnline.API.Security;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
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

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter = Math.Ceiling(retryAfter.TotalSeconds).ToString();

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Bạn thao tác quá nhiều lần. Vui lòng chờ một lúc rồi thử lại."
        }, cancellationToken);
    };

    static string GetClientKey(HttpContext context)
        => context.Connection.RemoteIpAddress?.ToString() ?? "unknown-client";

    options.AddPolicy(AuthRateLimitPolicies.Login, context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            GetClientKey(context),
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(AuthRateLimitPolicies.RequestPasswordReset, context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            GetClientKey(context),
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(15),
                SegmentsPerWindow = 3,
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(AuthRateLimitPolicies.ConfirmPasswordReset, context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            GetClientKey(context),
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(10),
                SegmentsPerWindow = 5,
                QueueLimit = 0,
                AutoReplenishment = true
            }));
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
            var taiKhoan = await db.Taikhoans
                .AsNoTracking()
                .Where(t => t.MaTaiKhoan == maTaiKhoan && t.TrangThai == true)
                .Select(t => new { t.MatKhau })
                .FirstOrDefaultAsync(
                    context.HttpContext.RequestAborted);

            if (taiKhoan == null)
            {
                context.Fail("Tài khoản không tồn tại hoặc đã bị khóa.");
                return;
            }

            var tokenVersion = context.Principal?.FindFirstValue(PasswordTokenVersion.ClaimType);
            if (!PasswordTokenVersion.Matches(tokenVersion, taiKhoan.MatKhau))
                context.Fail("Phiên đăng nhập đã bị thu hồi.");
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
builder.Services.AddSingleton<ICheckoutCartReservationService, CheckoutCartReservationService>();
var smtpOptions = builder.Services
    .AddOptions<SmtpEmailOptions>()
    .Bind(builder.Configuration.GetSection(SmtpEmailOptions.SectionName));

if (!builder.Environment.IsDevelopment())
{
    smtpOptions
        .Validate(options => options.IsValid(), "Cấu hình Email:Smtp chưa đầy đủ hoặc không hợp lệ.")
        .ValidateOnStart();
}

builder.Services.AddSingleton<IPasswordResetEmailSender, SmtpPasswordResetEmailSender>();
builder.Services.AddSingleton<PasswordResetEmailQueue>();
builder.Services.AddSingleton<IPasswordResetEmailQueue>(services =>
    services.GetRequiredService<PasswordResetEmailQueue>());
builder.Services.AddHostedService(services =>
    services.GetRequiredService<PasswordResetEmailQueue>());
builder.Services.AddHostedService<PendingOnlineOrderExpirationService>();
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

app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>(
    "/hubs/thong-bao"
);

app.Run();

// Cho phép kiểm thử API qua WebApplicationFactory.
public partial class Program { }
