using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/dia-chi")]
    [ApiController]
    [Authorize(Roles = "KhachHang")]
    public class DiaChiController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public DiaChiController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        public class DiaChiDto
        {
            [Required, MaxLength(100)] public string TenNguoiNhan { get; set; } = string.Empty;
            [Required, MaxLength(15)] public string SoDienThoaiNhan { get; set; } = string.Empty;
            [Required, MaxLength(255)] public string DiaChiCuThe { get; set; } = string.Empty;
            [MaxLength(100)] public string? GhiChu { get; set; }
            public bool MacDinh { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllDiaChi()
        {
            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null) return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var result = await _context.Diachis
                .AsNoTracking()
                .Where(x => x.MaKhachHang == khachHang.MaKhachHang)
                .OrderByDescending(x => x.MacDinh)
                .ThenByDescending(x => x.MaDiaChi)
                .Select(x => new
                {
                    x.MaDiaChi,
                    x.TenNguoiNhan,
                    x.SoDienThoaiNhan,
                    x.DiaChiCuThe,
                    x.GhiChu,
                    x.MacDinh
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDiaChi(DiaChiDto request)
        {
            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null) return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            bool daCoDiaChi = await _context.Diachis.AnyAsync(x => x.MaKhachHang == khachHang.MaKhachHang);

            var diaChi = new Diachi
            {
                MaKhachHang = khachHang.MaKhachHang,
                TenNguoiNhan = request.TenNguoiNhan.Trim(),
                SoDienThoaiNhan = request.SoDienThoaiNhan.Trim(),
                DiaChiCuThe = request.DiaChiCuThe.Trim(),
                GhiChu = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim(),
                MacDinh = request.MacDinh || !daCoDiaChi
            };

            if (diaChi.MacDinh)
            {
                var oldDefaults = await _context.Diachis
                    .Where(x => x.MaKhachHang == khachHang.MaKhachHang && x.MacDinh)
                    .ToListAsync();
                foreach (var item in oldDefaults) item.MacDinh = false;
            }

            _context.Diachis.Add(diaChi);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAllDiaChi), new { id = diaChi.MaDiaChi }, new
            {
                message = "Thêm địa chỉ thành công.",
                maDiaChi = diaChi.MaDiaChi
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDiaChi(int id, DiaChiDto request)
        {
            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null) return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var diaChi = await _context.Diachis
                .FirstOrDefaultAsync(x => x.MaDiaChi == id && x.MaKhachHang == khachHang.MaKhachHang);

            if (diaChi == null)
                return NotFound(new { message = "Không tìm thấy địa chỉ hoặc địa chỉ không thuộc tài khoản của bạn." });

            diaChi.TenNguoiNhan = request.TenNguoiNhan.Trim();
            diaChi.SoDienThoaiNhan = request.SoDienThoaiNhan.Trim();
            diaChi.DiaChiCuThe = request.DiaChiCuThe.Trim();
            diaChi.GhiChu = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim();

            if (request.MacDinh)
            {
                var others = await _context.Diachis
                    .Where(x => x.MaKhachHang == khachHang.MaKhachHang && x.MaDiaChi != id && x.MacDinh)
                    .ToListAsync();
                foreach (var item in others) item.MacDinh = false;
                diaChi.MacDinh = true;
            }
            else
            {
                diaChi.MacDinh = false;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật địa chỉ thành công." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDiaChi(int id)
        {
            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null) return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var diaChi = await _context.Diachis
                .FirstOrDefaultAsync(x => x.MaDiaChi == id && x.MaKhachHang == khachHang.MaKhachHang);

            if (diaChi == null)
                return NotFound(new { message = "Không tìm thấy địa chỉ hoặc địa chỉ không thuộc tài khoản của bạn." });

            bool wasDefault = diaChi.MacDinh;
            _context.Diachis.Remove(diaChi);

            if (wasDefault)
            {
                var next = await _context.Diachis
                    .Where(x => x.MaKhachHang == khachHang.MaKhachHang && x.MaDiaChi != id)
                    .OrderBy(x => x.MaDiaChi)
                    .FirstOrDefaultAsync();

                if (next != null) next.MacDinh = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa địa chỉ thành công." });
        }

        [HttpPut("{id:int}/mac-dinh")]
        public async Task<IActionResult> SetMacDinh(int id)
        {
            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null) return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var diaChi = await _context.Diachis
                .FirstOrDefaultAsync(x => x.MaDiaChi == id && x.MaKhachHang == khachHang.MaKhachHang);

            if (diaChi == null)
                return NotFound(new { message = "Không tìm thấy địa chỉ hoặc địa chỉ không thuộc tài khoản của bạn." });

            var addresses = await _context.Diachis
                .Where(x => x.MaKhachHang == khachHang.MaKhachHang)
                .ToListAsync();

            foreach (var item in addresses)
                item.MacDinh = item.MaDiaChi == id;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã đặt địa chỉ làm mặc định." });
        }

        private async Task<Khachhang?> GetCurrentKhachHang()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(value, out var maTaiKhoan)) return null;

            return await _context.Khachhangs
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan);
        }
    }
}
