using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;
        private const string JwtSecret = "DayLaMotChuoiBaoMatRatDaiChoJwtToken123456";

        public AuthController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        public class RegisterKhachHangDto
        {
            [Required, EmailAddress, MaxLength(100)] public string Email { get; set; } = string.Empty;
            [Required, MinLength(6), MaxLength(100)] public string MatKhau { get; set; } = string.Empty;
            [MaxLength(15)] public string? SoDienThoai { get; set; }
            [Required, MaxLength(100)] public string HoTen { get; set; } = string.Empty;
            public DateOnly? NgaySinh { get; set; }
            [MaxLength(10)] public string? GioiTinh { get; set; }
        }

        public class RegisterNhaHangDto
        {
            [Required, EmailAddress, MaxLength(100)] public string Email { get; set; } = string.Empty;
            [Required, MinLength(6), MaxLength(100)] public string MatKhau { get; set; } = string.Empty;
            [MaxLength(15)] public string? SoDienThoai { get; set; }
            [Required, MaxLength(150)] public string TenNhaHang { get; set; } = string.Empty;
            [MaxLength(500)] public string? MoTa { get; set; }
            [Required, MaxLength(255)] public string DiaChiQuan { get; set; } = string.Empty;
            [MaxLength(255)] public string? AnhBia { get; set; }
            public TimeOnly? GioMoCua { get; set; }
            public TimeOnly? GioDongCua { get; set; }
            public decimal PhiShipMacDinh { get; set; } = 15000;
        }

        public class LoginDto
        {
            [Required, EmailAddress] public string Email { get; set; } = string.Empty;
            [Required] public string MatKhau { get; set; } = string.Empty;
        }

        public class DoiMatKhauDto
        {
            [Required] public string MatKhauCu { get; set; } = string.Empty;
            [Required, MinLength(6), MaxLength(100)] public string MatKhauMoi { get; set; } = string.Empty;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterKhachHang(RegisterKhachHangDto request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var phone = Normalize(request.SoDienThoai);

            if (await _context.Taikhoans.AnyAsync(x => x.Email == email))
                return Conflict(new { message = "Email đã được sử dụng." });

            if (phone != null && await _context.Taikhoans.AnyAsync(x => x.SoDienThoai == phone))
                return Conflict(new { message = "Số điện thoại đã được sử dụng." });

            var role = await _context.Roles.FirstOrDefaultAsync(x => x.TenRole == "KhachHang");
            if (role == null)
                return StatusCode(500, new { message = "Chưa có Role KhachHang trong database." });

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var taiKhoan = new Taikhoan
                {
                    Email = email,
                    MatKhau = HashPassword(request.MatKhau),
                    SoDienThoai = phone,
                    MaRole = role.MaRole,
                    TrangThai = true,
                    DaXacThucEmail = false,
                    AnhDaiDien = null
                };

                _context.Taikhoans.Add(taiKhoan);
                await _context.SaveChangesAsync();

                var khachHang = new Khachhang
                {
                    MaTaiKhoan = taiKhoan.MaTaiKhoan,
                    HoTen = request.HoTen.Trim(),
                    NgaySinh = request.NgaySinh,
                    GioiTinh = Normalize(request.GioiTinh),
                    DiemTichLuy = 0
                };

                _context.Khachhangs.Add(khachHang);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Created("/api/auth/me", new
                {
                    message = "Đăng ký khách hàng thành công.",
                    maTaiKhoan = taiKhoan.MaTaiKhoan
                });
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "Email hoặc số điện thoại đã tồn tại." });
            }
        }

        [HttpPost("register-nha-hang")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterNhaHang(RegisterNhaHangDto request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var phone = Normalize(request.SoDienThoai);

            if (request.PhiShipMacDinh < 0)
                return BadRequest(new { message = "PhiShipMacDinh không được âm." });

            if (request.GioMoCua.HasValue && request.GioDongCua.HasValue && request.GioMoCua == request.GioDongCua)
                return BadRequest(new { message = "Giờ mở cửa và giờ đóng cửa không được giống nhau." });

            if (await _context.Taikhoans.AnyAsync(x => x.Email == email))
                return Conflict(new { message = "Email đã được sử dụng." });

            if (phone != null && await _context.Taikhoans.AnyAsync(x => x.SoDienThoai == phone))
                return Conflict(new { message = "Số điện thoại đã được sử dụng." });

            var role = await _context.Roles.FirstOrDefaultAsync(x => x.TenRole == "Quan");
            if (role == null)
                return StatusCode(500, new { message = "Chưa có Role Quan trong database." });

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var taiKhoan = new Taikhoan
                {
                    Email = email,
                    MatKhau = HashPassword(request.MatKhau),
                    SoDienThoai = phone,
                    MaRole = role.MaRole,
                    TrangThai = true,
                    DaXacThucEmail = false
                };

                _context.Taikhoans.Add(taiKhoan);
                await _context.SaveChangesAsync();

                var nhaHang = new Nhahang
                {
                    MaTaiKhoan = taiKhoan.MaTaiKhoan,
                    TenNhaHang = request.TenNhaHang.Trim(),
                    MoTa = Normalize(request.MoTa),
                    DiaChiQuan = request.DiaChiQuan.Trim(),
                    AnhBia = Normalize(request.AnhBia),
                    GioMoCua = request.GioMoCua,
                    GioDongCua = request.GioDongCua,
                    TrangThaiDuyet = "ChoDuyet",
                    TrangThaiHoatDong = "MoCua",
                    DanhGiaTrungBinh = 0,
                    PhiShipMacDinh = request.PhiShipMacDinh
                };

                _context.Nhahangs.Add(nhaHang);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Created("/api/auth/me", new
                {
                    message = "Đăng ký quán thành công, đang chờ Admin duyệt.",
                    maTaiKhoan = taiKhoan.MaTaiKhoan,
                    maNhaHang = nhaHang.MaNhaHang
                });
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "Email hoặc số điện thoại đã tồn tại." });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var taiKhoan = await _context.Taikhoans
                .Include(x => x.MaRoleNavigation)
                .FirstOrDefaultAsync(x => x.Email == email);

            if (taiKhoan == null || !VerifyPassword(request.MatKhau, taiKhoan.MatKhau))
                return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

            if (taiKhoan.TrangThai != true)
                return Unauthorized(new { message = "Tài khoản đã bị khóa." });

            var role = taiKhoan.MaRoleNavigation?.TenRole;
            if (string.IsNullOrWhiteSpace(role))
                return StatusCode(500, new { message = "Tài khoản chưa được gán Role hợp lệ." });

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, taiKhoan.MaTaiKhoan.ToString()),
                new Claim(ClaimTypes.Name, taiKhoan.Email),
                new Claim(ClaimTypes.Role, role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds);

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiresAt = token.ValidTo,
                maTaiKhoan = taiKhoan.MaTaiKhoan,
                role
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null)
                return Unauthorized(new { message = "Token không chứa MaTaiKhoan hợp lệ." });

            var taiKhoan = await _context.Taikhoans
                .AsNoTracking()
                .Include(x => x.MaRoleNavigation)
                .Include(x => x.Khachhang)
                .Include(x => x.Nhahang)
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

            if (taiKhoan == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            return Ok(new
            {
                maTaiKhoan = taiKhoan.MaTaiKhoan,
                email = taiKhoan.Email,
                soDienThoai = taiKhoan.SoDienThoai,
                anhDaiDien = taiKhoan.AnhDaiDien,
                trangThai = taiKhoan.TrangThai,
                daXacThucEmail = taiKhoan.DaXacThucEmail,
                ngayTao = taiKhoan.NgayTao,
                role = taiKhoan.MaRoleNavigation?.TenRole,
                khachHang = taiKhoan.Khachhang == null ? null : new
                {
                    maKhachHang = taiKhoan.Khachhang.MaKhachHang,
                    hoTen = taiKhoan.Khachhang.HoTen,
                    ngaySinh = taiKhoan.Khachhang.NgaySinh,
                    gioiTinh = taiKhoan.Khachhang.GioiTinh,
                    diemTichLuy = taiKhoan.Khachhang.DiemTichLuy
                },
                nhaHang = taiKhoan.Nhahang == null ? null : new
                {
                    maNhaHang = taiKhoan.Nhahang.MaNhaHang,
                    tenNhaHang = taiKhoan.Nhahang.TenNhaHang,
                    trangThaiDuyet = taiKhoan.Nhahang.TrangThaiDuyet,
                    trangThaiHoatDong = taiKhoan.Nhahang.TrangThaiHoatDong
                }
            });
        }

        [HttpPut("doi-mat-khau")]
        [Authorize]
        public async Task<IActionResult> DoiMatKhau(DoiMatKhauDto request)
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null)
                return Unauthorized(new { message = "Token không hợp lệ." });

            var taiKhoan = await _context.Taikhoans.FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);
            if (taiKhoan == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            if (!VerifyPassword(request.MatKhauCu, taiKhoan.MatKhau))
                return BadRequest(new { message = "Mật khẩu cũ không đúng." });

            if (request.MatKhauCu == request.MatKhauMoi)
                return BadRequest(new { message = "Mật khẩu mới phải khác mật khẩu cũ." });

            taiKhoan.MatKhau = HashPassword(request.MatKhauMoi);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công." });
        }

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }

        private static string? Normalize(string? value)
            => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string HashPassword(string password)
        {
            const int iterations = 100_000;
            byte[] salt = RandomNumberGenerator.GetBytes(16);
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, 32);
            return $"PBKDF2${iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        private static bool VerifyPassword(string password, string storedHash)
        {
            try
            {
                var parts = storedHash.Split('$');
                if (parts.Length != 4 || parts[0] != "PBKDF2") return false;

                int iterations = int.Parse(parts[1]);
                byte[] salt = Convert.FromBase64String(parts[2]);
                byte[] expected = Convert.FromBase64String(parts[3]);
                byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);

                return CryptographicOperations.FixedTimeEquals(actual, expected);
            }
            catch
            {
                return false;
            }
        }
    }
}
