using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/nha-hang")]
    [ApiController]
    public class NhaHangController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public NhaHangController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        public class UpdateNhaHangDto
        {
            [Required, MaxLength(150)] public string TenNhaHang { get; set; } = string.Empty;
            [MaxLength(500)] public string? MoTa { get; set; }
            [Required, MaxLength(255)] public string DiaChiQuan { get; set; } = string.Empty;
            [MaxLength(255)] public string? AnhBia { get; set; }
            public TimeOnly? GioMoCua { get; set; }
            public TimeOnly? GioDongCua { get; set; }
            public decimal PhiShipMacDinh { get; set; }
        }

        public class UpdateTrangThaiDto
        {
            [Required] public string TrangThaiHoatDong { get; set; } = string.Empty;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetDanhSachNhaHang()
        {
            var result = await _context.Nhahangs
                .AsNoTracking()
                .Where(x => x.TrangThaiDuyet == "DaDuyet")
                .OrderBy(x => x.TenNhaHang)
                .Select(x => new
                {
                    x.MaNhaHang,
                    x.TenNhaHang,
                    x.MoTa,
                    x.DiaChiQuan,
                    x.AnhBia,
                    x.GioMoCua,
                    x.GioDongCua,
                    x.TrangThaiHoatDong,
                    x.DanhGiaTrungBinh,
                    x.PhiShipMacDinh
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetChiTietNhaHang(int id)
        {
            var result = await _context.Nhahangs
                .AsNoTracking()
                .Where(x => x.MaNhaHang == id && x.TrangThaiDuyet == "DaDuyet")
                .Select(x => new
                {
                    x.MaNhaHang,
                    x.TenNhaHang,
                    x.MoTa,
                    x.DiaChiQuan,
                    x.AnhBia,
                    x.GioMoCua,
                    x.GioDongCua,
                    x.TrangThaiHoatDong,
                    x.DanhGiaTrungBinh,
                    x.PhiShipMacDinh
                })
                .FirstOrDefaultAsync();

            if (result == null)
                return NotFound(new { message = "Không tìm thấy nhà hàng hoặc nhà hàng chưa được duyệt." });

            return Ok(result);
        }

        [HttpGet("ho-so")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> GetHoSoQuan()
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            var result = await _context.Nhahangs
                .AsNoTracking()
                .Include(x => x.MaTaiKhoanNavigation)
                .Where(x => x.MaTaiKhoan == maTaiKhoan.Value)
                .Select(x => new
                {
                    x.MaNhaHang,
                    x.MaTaiKhoan,
                    x.TenNhaHang,
                    x.MoTa,
                    x.DiaChiQuan,
                    x.AnhBia,
                    x.GioMoCua,
                    x.GioDongCua,
                    x.TrangThaiDuyet,
                    x.TrangThaiHoatDong,
                    x.DanhGiaTrungBinh,
                    x.PhiShipMacDinh,
                    email = x.MaTaiKhoanNavigation.Email,
                    soDienThoai = x.MaTaiKhoanNavigation.SoDienThoai
                })
                .FirstOrDefaultAsync();

            if (result == null)
                return NotFound(new { message = "Không tìm thấy nhà hàng của tài khoản này." });

            return Ok(result);
        }

        [HttpPut("ho-so")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateHoSoQuan(UpdateNhaHangDto request)
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            if (request.PhiShipMacDinh < 0)
                return BadRequest(new { message = "PhiShipMacDinh không được âm." });

            if (request.GioMoCua.HasValue && request.GioDongCua.HasValue && request.GioMoCua == request.GioDongCua)
                return BadRequest(new { message = "Giờ mở cửa và giờ đóng cửa không được giống nhau." });

            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

            if (nhaHang == null)
                return NotFound(new { message = "Không tìm thấy nhà hàng của tài khoản này." });

            nhaHang.TenNhaHang = request.TenNhaHang.Trim();
            nhaHang.MoTa = string.IsNullOrWhiteSpace(request.MoTa) ? null : request.MoTa.Trim();
            nhaHang.DiaChiQuan = request.DiaChiQuan.Trim();
            nhaHang.AnhBia = string.IsNullOrWhiteSpace(request.AnhBia) ? null : request.AnhBia.Trim();
            nhaHang.GioMoCua = request.GioMoCua;
            nhaHang.GioDongCua = request.GioDongCua;
            nhaHang.PhiShipMacDinh = request.PhiShipMacDinh;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật hồ sơ nhà hàng thành công." });
        }

        [HttpPut("trang-thai-hoat-dong")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateTrangThai(UpdateTrangThaiDto request)
        {
            var status = request.TrangThaiHoatDong.Trim();
            if (status != "MoCua" && status != "TamNgung")
                return BadRequest(new { message = "TrangThaiHoatDong chỉ nhận MoCua hoặc TamNgung." });

            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

            if (nhaHang == null)
                return NotFound(new { message = "Không tìm thấy nhà hàng của tài khoản này." });

            if (nhaHang.TrangThaiDuyet != "DaDuyet")
                return BadRequest(new { message = "Nhà hàng chưa được Admin duyệt nên chưa thể nhận đơn." });

            nhaHang.TrangThaiHoatDong = status;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật trạng thái hoạt động thành công.",
                trangThaiHoatDong = nhaHang.TrangThaiHoatDong
            });
        }

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
