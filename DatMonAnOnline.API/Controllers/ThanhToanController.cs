using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/thanh-toan")]
    [ApiController]
    public class ThanhToanController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public ThanhToanController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        public class TaoThanhToanDto
        {
            [Required] public int MaDonHang { get; set; }
            [Required] public int MaPhuongThuc { get; set; }
        }

        public class MoPhongKetQuaDto
        {
            [Required, MaxLength(20)] public string KetQua { get; set; } = string.Empty;
        }

        public class DoiPhuongThucDto
        {
            [Required] public int MaPhuongThuc { get; set; }
        }

        [HttpGet("phuong-thuc")]
        [Authorize]
        public async Task<IActionResult> GetPhuongThucThanhToan()
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            var result = await _context.Phuongthucthanhtoans
                .AsNoTracking()
                .Where(x => x.TrangThai == true)
                .OrderBy(x => x.MaPhuongThuc)
                .Select(x => new
                {
                    x.MaPhuongThuc,
                    x.TenPhuongThuc,
                    x.TrangThai
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> TaoThanhToan(TaoThanhToanDto request)
        {
            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var donHang = await _context.Donhangs
                .FirstOrDefaultAsync(x => x.MaDonHang == request.MaDonHang);

            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng." });

            if (donHang.MaKhachHang != khachHang.MaKhachHang)
                return StatusCode(403, new { message = "Bạn không có quyền thanh toán đơn hàng này." });

            if (donHang.MaTrangThai == 6)
                return BadRequest(new { message = "Đơn hàng đã huỷ, không thể thanh toán." });

            var daThanhCong = await _context.Thanhtoans
                .AnyAsync(x => x.MaDonHang == donHang.MaDonHang && x.TrangThaiThanhToan == "ThanhCong");

            if (daThanhCong)
                return BadRequest(new { message = "Đơn hàng đã thanh toán thành công." });

            var dangCho = await _context.Thanhtoans
                .AnyAsync(x => x.MaDonHang == donHang.MaDonHang && x.TrangThaiThanhToan == "ChoThanhToan");

            if (dangCho)
                return BadRequest(new { message = "Đơn hàng đang có giao dịch chờ thanh toán." });

            var phuongThuc = await LayPhuongThucDangBat(request.MaPhuongThuc);
            if (phuongThuc == null)
                return BadRequest(new { message = "Phương thức thanh toán không hợp lệ hoặc đã tắt." });

            var thanhToan = new Thanhtoan
            {
                MaDonHang = donHang.MaDonHang,
                MaPhuongThuc = phuongThuc.MaPhuongThuc,
                SoTien = donHang.ThanhTien,
                TrangThaiThanhToan = "ChoThanhToan",
                MaGiaoDich = null,
                ThoiGianThanhToan = null
            };

            _context.Thanhtoans.Add(thanhToan);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo thanh toán thành công.",
                maThanhToan = thanhToan.MaThanhToan,
                maDonHang = thanhToan.MaDonHang,
                maPhuongThuc = thanhToan.MaPhuongThuc,
                tenPhuongThuc = phuongThuc.TenPhuongThuc,
                soTien = thanhToan.SoTien,
                trangThaiThanhToan = thanhToan.TrangThaiThanhToan
            });
        }

        [HttpGet("don-hang/{maDonHang:int}")]
        [Authorize]
        public async Task<IActionResult> GetThanhToanTheoDonHang(int maDonHang)
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });

            var donHang = await _context.Donhangs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MaDonHang == maDonHang);

            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng." });

            var role = User.FindFirstValue(ClaimTypes.Role);
            var duocXem = await KiemTraQuyenXemDonHang(role, maTaiKhoan.Value, donHang);
            if (duocXem == false)
                return StatusCode(403, new { message = "Bạn không có quyền xem thanh toán đơn hàng này." });
            if (duocXem == null)
                return Unauthorized(new { message = "Token không hợp lệ." });

            var result = await _context.Thanhtoans
                .AsNoTracking()
                .Where(x => x.MaDonHang == maDonHang)
                .OrderByDescending(x => x.MaThanhToan)
                .Select(x => new
                {
                    x.MaThanhToan,
                    x.MaDonHang,
                    x.MaPhuongThuc,
                    tenPhuongThuc = x.MaPhuongThucNavigation.TenPhuongThuc,
                    x.SoTien,
                    x.TrangThaiThanhToan,
                    x.MaGiaoDich,
                    x.ThoiGianThanhToan
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpPut("{id:int}/mo-phong")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> MoPhongKetQuaThanhToan(int id, MoPhongKetQuaDto request) // mo phong thong tin thanh toan ( thnah cong hoac that bai)
        {
            var ketQua = request.KetQua.Trim();
            if (ketQua != "ThanhCong" && ketQua != "ThatBai")
                return BadRequest(new { message = "KetQua chỉ nhận ThanhCong hoặc ThatBai." });

            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var thanhToan = await _context.Thanhtoans
                .Include(x => x.MaDonHangNavigation)
                .Include(x => x.MaPhuongThucNavigation)
                .FirstOrDefaultAsync(x => x.MaThanhToan == id);

            if (thanhToan == null)
                return NotFound(new { message = "Không tìm thấy giao dịch thanh toán." });

            if (thanhToan.MaDonHangNavigation.MaKhachHang != khachHang.MaKhachHang)
                return StatusCode(403, new { message = "Bạn không có quyền xử lý giao dịch này." });

            if (thanhToan.TrangThaiThanhToan != "ChoThanhToan")
                return BadRequest(new { message = "Chỉ mô phỏng được giao dịch đang chờ thanh toán." });

            if (thanhToan.MaPhuongThucNavigation.TenPhuongThuc == "COD")
                return BadRequest(new { message = "Thanh toán khi nhan hang không mô phỏng. Sẽ thành công khi quán hoàn thành đơn." });

            thanhToan.TrangThaiThanhToan = ketQua;
            thanhToan.ThoiGianThanhToan = DateTime.Now;
            thanhToan.MaGiaoDich = $"{thanhToan.MaPhuongThucNavigation.TenPhuongThuc.ToUpperInvariant()}_{DateTime.Now:yyyyMMddHHmmss}_{thanhToan.MaThanhToan}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = ketQua == "ThanhCong" ? "Thanh toán thành công." : "Thanh toán thất bại.",
                maThanhToan = thanhToan.MaThanhToan,
                tenPhuongThuc = thanhToan.MaPhuongThucNavigation.TenPhuongThuc,
                trangThaiThanhToan = thanhToan.TrangThaiThanhToan,
                maGiaoDich = thanhToan.MaGiaoDich,
                thoiGianThanhToan = thanhToan.ThoiGianThanhToan
            });
        }

        [HttpPost("{id:int}/doi-phuong-thuc")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DoiPhuongThucKhiThatBai(int id, DoiPhuongThucDto request)
        {
            var khachHang = await GetCurrentKhachHang();
            if (khachHang == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var thanhToanCu = await _context.Thanhtoans
                .Include(x => x.MaDonHangNavigation)
                .FirstOrDefaultAsync(x => x.MaThanhToan == id);

            if (thanhToanCu == null)
                return NotFound(new { message = "Không tìm thấy giao dịch thanh toán." });

            if (thanhToanCu.MaDonHangNavigation.MaKhachHang != khachHang.MaKhachHang)
                return StatusCode(403, new { message = "Bạn không có quyền đổi phương thức giao dịch này." });

            if (thanhToanCu.TrangThaiThanhToan == "ThanhCong")
                return BadRequest(new { message = "Đơn đã thanh toán thành công, không thể đổi phương thức." });

            if (thanhToanCu.TrangThaiThanhToan != "ThatBai")
                return BadRequest(new { message = "Chỉ đổi phương thức khi giao dịch thất bại." });

            if (thanhToanCu.MaDonHangNavigation.MaTrangThai == 6)
                return BadRequest(new { message = "Đơn hàng đã huỷ, không thể đổi phương thức thanh toán." });

            var daThanhCong = await _context.Thanhtoans
                .AnyAsync(x => x.MaDonHang == thanhToanCu.MaDonHang && x.TrangThaiThanhToan == "ThanhCong");

            if (daThanhCong)
                return BadRequest(new { message = "Đơn hàng đã thanh toán thành công." });

            var dangCho = await _context.Thanhtoans
                .AnyAsync(x => x.MaDonHang == thanhToanCu.MaDonHang && x.TrangThaiThanhToan == "ChoThanhToan");

            if (dangCho)
                return BadRequest(new { message = "Đơn hàng đang có giao dịch chờ thanh toán." });

            var phuongThuc = await LayPhuongThucDangBat(request.MaPhuongThuc);
            if (phuongThuc == null)
                return BadRequest(new { message = "Phương thức thanh toán không hợp lệ hoặc đã tắt." });

            var thanhToanMoi = new Thanhtoan
            {
                MaDonHang = thanhToanCu.MaDonHang,
                MaPhuongThuc = phuongThuc.MaPhuongThuc,
                SoTien = thanhToanCu.MaDonHangNavigation.ThanhTien,
                TrangThaiThanhToan = "ChoThanhToan",
                MaGiaoDich = null,
                ThoiGianThanhToan = null
            };

            _context.Thanhtoans.Add(thanhToanMoi);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã tạo giao dịch mới với phương thức thanh toán khác.",
                maThanhToanCu = thanhToanCu.MaThanhToan,
                maThanhToanMoi = thanhToanMoi.MaThanhToan,
                maPhuongThuc = thanhToanMoi.MaPhuongThuc,
                tenPhuongThuc = phuongThuc.TenPhuongThuc,
                soTien = thanhToanMoi.SoTien,
                trangThaiThanhToan = thanhToanMoi.TrangThaiThanhToan
            });
        }

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }

        private async Task<Khachhang?> GetCurrentKhachHang()
        {
            var maTaiKhoan = GetMaTaiKhoan();
            if (maTaiKhoan == null) return null;

            return await _context.Khachhangs
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);
        }

        private async Task<Phuongthucthanhtoan?> LayPhuongThucDangBat(int maPhuongThuc)
        {
            return await _context.Phuongthucthanhtoans
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MaPhuongThuc == maPhuongThuc && x.TrangThai == true);
        }

        private async Task<bool?> KiemTraQuyenXemDonHang(string? role, int maTaiKhoan, Donhang donHang)
        {
            if (role == "KhachHang")
            {
                var khachHang = await _context.Khachhangs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan);

                if (khachHang == null) return null;
                return donHang.MaKhachHang == khachHang.MaKhachHang;
            }

            if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan);

                if (nhaHang == null) return null;
                return donHang.MaNhaHang == nhaHang.MaNhaHang;
            }

            return false;
        }
    }
}
