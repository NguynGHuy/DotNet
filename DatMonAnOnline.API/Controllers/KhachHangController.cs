using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/khach-hang")]
    [ApiController]
    [Authorize(Roles = "KhachHang")]
    public class KhachHangController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;
        private readonly IWebHostEnvironment _environment;

        public KhachHangController(
            DatMonAnOnlineContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        public class UpdateHoSoDto
        {
            [Required, MaxLength(100)] public string HoTen { get; set; } = string.Empty;
            public DateOnly? NgaySinh { get; set; }
            [MaxLength(10)] public string? GioiTinh { get; set; }
        }

        [HttpGet("ho-so")]
        public async Task<IActionResult> GetHoSo()
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            var khachHang = await _context.Khachhangs
                .AsNoTracking()
                .Include(x => x.MaTaiKhoanNavigation)
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

            if (khachHang == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            return Ok(new
            {
                maKhachHang = khachHang.MaKhachHang,
                maTaiKhoan = khachHang.MaTaiKhoan,
                hoTen = khachHang.HoTen,
                ngaySinh = khachHang.NgaySinh,
                gioiTinh = khachHang.GioiTinh,
                diemTichLuy = khachHang.DiemTichLuy,
                email = khachHang.MaTaiKhoanNavigation?.Email,
                soDienThoai = khachHang.MaTaiKhoanNavigation?.SoDienThoai,
                anhDaiDien = khachHang.MaTaiKhoanNavigation?.AnhDaiDien
            });
        }

        [HttpPut("ho-so")]
        public async Task<IActionResult> UpdateHoSo(UpdateHoSoDto request)
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            var khachHang = await _context.Khachhangs
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

            if (khachHang == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            khachHang.HoTen = request.HoTen.Trim();
            khachHang.NgaySinh = request.NgaySinh;
            khachHang.GioiTinh = string.IsNullOrWhiteSpace(request.GioiTinh) ? null : request.GioiTinh.Trim();

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật hồ sơ khách hàng thành công." });
        }

        [HttpPost("anh-dai-dien")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> UploadAnhDaiDien(IFormFile? file)
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn ảnh đại diện." });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Ảnh đại diện không được lớn hơn 5 MB." });

            var extension = file.ContentType.ToLowerInvariant() switch
            {
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => null
            };

            if (extension == null || !await HasValidImageSignature(file, extension))
                return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP hợp lệ." });

            var account = await _context.Taikhoans
                .FirstOrDefaultAsync(item => item.MaTaiKhoan == maTaiKhoan.Value);

            if (account == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            var uploadDirectory = GetAvatarDirectory();
            Directory.CreateDirectory(uploadDirectory);

            var fileName = $"{maTaiKhoan.Value}_{Guid.NewGuid():N}{extension}";
            var physicalPath = Path.Combine(uploadDirectory, fileName);
            var publicPath = $"/uploads/avatars/{fileName}";
            var oldAvatar = account.AnhDaiDien;

            await using (var output = System.IO.File.Create(physicalPath))
                await file.CopyToAsync(output, HttpContext.RequestAborted);

            try
            {
                account.AnhDaiDien = publicPath;
                await _context.SaveChangesAsync();
                DeleteStoredAvatar(oldAvatar);
            }
            catch
            {
                if (System.IO.File.Exists(physicalPath))
                    System.IO.File.Delete(physicalPath);
                throw;
            }

            return Ok(new
            {
                message = "Ảnh đại diện đã được cập nhật.",
                anhDaiDien = publicPath
            });
        }

        [HttpDelete("anh-dai-dien")]
        public async Task<IActionResult> DeleteAnhDaiDien()
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            var account = await _context.Taikhoans
                .FirstOrDefaultAsync(item => item.MaTaiKhoan == maTaiKhoan.Value);

            if (account == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            var oldAvatar = account.AnhDaiDien;
            account.AnhDaiDien = null;
            await _context.SaveChangesAsync();
            DeleteStoredAvatar(oldAvatar);

            return Ok(new { message = "Đã gỡ ảnh đại diện." });
        }

        private string GetAvatarDirectory()
        {
            var webRoot = _environment.WebRootPath ??
                          Path.Combine(_environment.ContentRootPath, "wwwroot");
            return Path.Combine(webRoot, "uploads", "avatars");
        }

        private void DeleteStoredAvatar(string? publicPath)
        {
            if (string.IsNullOrWhiteSpace(publicPath) ||
                !publicPath.StartsWith("/uploads/avatars/", StringComparison.Ordinal))
            {
                return;
            }

            var fileName = Path.GetFileName(publicPath);
            var fullPath = Path.Combine(GetAvatarDirectory(), fileName);

            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        private static async Task<bool> HasValidImageSignature(IFormFile file, string extension)
        {
            var header = new byte[12];
            await using var stream = file.OpenReadStream();
            var read = await stream.ReadAsync(header.AsMemory(0, header.Length));

            return extension switch
            {
                ".jpg" => read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
                ".png" => read >= 8 && header[..8].SequenceEqual(
                    new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
                ".webp" => read >= 12 &&
                            header[..4].SequenceEqual("RIFF"u8.ToArray()) &&
                            header[8..12].SequenceEqual("WEBP"u8.ToArray()),
                _ => false
            };
        }

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
