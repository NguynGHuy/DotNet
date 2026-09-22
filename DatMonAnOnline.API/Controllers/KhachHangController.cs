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

        public KhachHangController(DatMonAnOnlineContext context)
        {
            _context = context;
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

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
