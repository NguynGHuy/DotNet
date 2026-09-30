using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173","http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod();
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
        options.JsonSerializerOptions.MaxDepth = 64;
    });

// =========================
// OPENAPI
// =========================

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();

        document.Components.SecuritySchemes ??=
            new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["Bearer"] =
            new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                In = ParameterLocation.Header,
                BearerFormat = "JWT"
            };

        return Task.CompletedTask;
    });
});


// =========================
// DEVELOPMENT
// =========================
var app = builder.Build();

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

app.Run();