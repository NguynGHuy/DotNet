using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [ApiController]
    public class DanhGiaController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public DanhGiaController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        private int GetKhachHangId()
        {
            var tkId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            return _context.Khachhangs.FirstOrDefault(k => k.MaTaiKhoan == tkId)?.MaKhachHang ?? 0;
        }

        [HttpPost("api/danh-gia-mon-an")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DanhGiaMonAn([FromBody] DanhGiaMonAnRequest req)
        {
            int maKhachHang = GetKhachHangId();

            // Check trạng thái đơn hàng (5 = HoanThanh)
            var donHang = await _context.Donhangs.FindAsync(req.MaDonHang);
            if (donHang == null || donHang.MaTrangThai != 5)
                return BadRequest("Chỉ được đánh giá các đơn hàng đã hoàn thành.");

            // Check đánh giá trùng
            bool isExist = await _context.Danhgiamonans.AnyAsync(x =>
                x.MaKhachHang == maKhachHang && x.MaMonAn == req.MaMonAn && x.MaDonHang == req.MaDonHang);
            if (isExist) return BadRequest("Bạn đã đánh giá món này trong đơn hàng này rồi.");

            // Chuyển dữ liệu từ Request (DTO) sang Entity Model để lưu vào DB
            var model = new Danhgiamonan
            {
                MaKhachHang = maKhachHang,
                MaMonAn = req.MaMonAn,
                MaDonHang = req.MaDonHang,
                SoSao = req.SoSao,
                NoiDung = req.NoiDung,
                HinhAnh = req.HinhAnh,
                NgayDanhGia = DateTime.Now
            };

            _context.Danhgiamonans.Add(model);
            await _context.SaveChangesAsync();

            // Cập nhật Rating cho Món ăn
            var avg = await _context.Danhgiamonans.Where(x => x.MaMonAn == model.MaMonAn).AverageAsync(x => x.SoSao);
            var mon = await _context.Monans.FindAsync(model.MaMonAn);
            if (mon != null)
            {
                mon.DanhGiaTrungBinh = (float)avg;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Đánh giá món ăn thành công" });
        }

        [HttpGet("api/mon-an/{id}/danh-gia")]
        public async Task<IActionResult> XemDanhGiaMonAn(int id)
        {
            var list = await _context.Danhgiamonans
                .Where(x => x.MaMonAn == id)
                .OrderByDescending(x => x.NgayDanhGia)
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost("api/danh-gia-nha-hang")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DanhGiaNhaHang([FromBody] DanhGiaNhaHangRequest req)
        {
            int maKhachHang = GetKhachHangId();

            var donHang = await _context.Donhangs.FindAsync(req.MaDonHang);
            if (donHang == null || donHang.MaTrangThai != 5)
                return BadRequest("Chỉ được đánh giá các đơn hàng đã hoàn thành.");

            bool isExist = await _context.Danhgianhahangs.AnyAsync(x =>
                x.MaKhachHang == maKhachHang && x.MaNhaHang == req.MaNhaHang && x.MaDonHang == req.MaDonHang);
            if (isExist) return BadRequest("Bạn đã đánh giá nhà hàng này rồi.");

            var model = new Danhgianhahang
            {
                MaKhachHang = maKhachHang,
                MaNhaHang = req.MaNhaHang,
                MaDonHang = req.MaDonHang,
                SoSao = req.SoSao,
                NoiDung = req.NoiDung,
                NgayDanhGia = DateTime.Now
            };

            _context.Danhgianhahangs.Add(model);
            await _context.SaveChangesAsync();

            // Cập nhật Rating cho Quán
            var avg = await _context.Danhgianhahangs.Where(x => x.MaNhaHang == model.MaNhaHang).AverageAsync(x => x.SoSao);
            var quan = await _context.Nhahangs.FindAsync(model.MaNhaHang);
            if (quan != null)
            {
                quan.DanhGiaTrungBinh = (float)avg;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Đánh giá nhà hàng thành công" });
        }

        [HttpGet("api/nha-hang/{id}/danh-gia")]
        public async Task<IActionResult> XemDanhGiaNhaHang(int id)
        {
            var list = await _context.Danhgianhahangs
                .Where(x => x.MaNhaHang == id)
                .OrderByDescending(x => x.NgayDanhGia)
                .ToListAsync();
            return Ok(list);
        }
    }

    // --- CÁC CLASS DTO HỨNG DỮ LIỆU TỪ POSTMAN ---
    public class DanhGiaMonAnRequest
    {
        public int MaMonAn { get; set; }
        public int MaDonHang { get; set; }
        public sbyte SoSao { get; set; }
        public string? NoiDung { get; set; }
        public string? HinhAnh { get; set; }
    }

    public class DanhGiaNhaHangRequest
    {
        public int MaNhaHang { get; set; }
        public int MaDonHang { get; set; }
        public sbyte SoSao { get; set; }
        public string? NoiDung { get; set; }
    }
}