using DatMonAnOnline.API.Models;
using DatMonAnOnline.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/gio-hang")]
    [ApiController]
    [Authorize(Roles = "KhachHang")]
    public class GioHangController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public GioHangController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        private async Task<int?> LayMaKhachHang()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var maTaiKhoan)) return null;

            var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
            return khachHang?.MaKhachHang;
        }

        private async Task<Giohang> LayHoacTaoGioHang(int maKhachHang)
        {
            var gioHang = await _context.Giohangs
                .Include(g => g.Chitietgiohangs).ThenInclude(ct => ct.MaMonAnNavigation)
                .Include(g => g.Chitietgiohangs).ThenInclude(ct => ct.ChitietgiohangToppings)
                .FirstOrDefaultAsync(g => g.MaKhachHang == maKhachHang);

            if (gioHang == null)
            {
                gioHang = new Giohang { MaKhachHang = maKhachHang, NgayCapNhat = DateTime.Now };
                _context.Giohangs.Add(gioHang);
                await _context.SaveChangesAsync();
            }
            return gioHang;
        }

        [HttpGet]
        public async Task<IActionResult> XemGioHang()
        {
            var maKhachHang = await LayMaKhachHang();
            if (maKhachHang == null) return Unauthorized("Không tìm thấy thông tin khách hàng.");

            var gioHang = await LayHoacTaoGioHang(maKhachHang.Value);

            var danhSachChiTiet = gioHang.Chitietgiohangs.Select(ct => new
            {
                MaChiTietGioHang = ct.MaChiTietGioHang,
                MaMonAn = ct.MaMonAn,
                TenMonAn = ct.MaMonAnNavigation.TenMonAn,
                HinhAnh = ct.MaMonAnNavigation.HinhAnh,
                DonGia = ct.MaMonAnNavigation.Gia,
                SoLuong = ct.SoLuong,
                GhiChu = ct.GhiChu,
                Toppings = ct.ChitietgiohangToppings.Select(tp => new
                {
                    MaTopping = tp.MaTopping,
                    TenTopping = _context.Toppings.FirstOrDefault(t => t.MaTopping == tp.MaTopping)?.TenTopping,
                    GiaThem = tp.GiaThem,
                    SoLuong = tp.SoLuong
                }).ToList(),
                ThanhTien = (ct.MaMonAnNavigation.Gia + ct.ChitietgiohangToppings.Sum(tp => tp.GiaThem * tp.SoLuong)) * ct.SoLuong
            }).ToList();

            return Ok(new
            {
                MaGioHang = gioHang.MaGioHang,
                MaNhaHang = danhSachChiTiet.FirstOrDefault() != null ? gioHang.Chitietgiohangs.First().MaMonAnNavigation.MaNhaHang : (int?)null,
                NgayCapNhat = gioHang.NgayCapNhat,
                TongTienTamTinh = danhSachChiTiet.Sum(x => x.ThanhTien),
                ChiTiet = danhSachChiTiet
            });
        }

        [HttpPost("them-mon")]
        public async Task<IActionResult> ThemMonVaoGio([FromBody] ThemMonYeuCau request)
        {
            var maKhachHang = await LayMaKhachHang();
            if (maKhachHang == null) return Unauthorized();

            var monAn = await _context.Monans
                .AsNoTracking()
                .Include(m => m.MaNhomToppings).ThenInclude(nhom => nhom.Toppings)
                .FirstOrDefaultAsync(m => m.MaMonAn == request.MaMonAn);
            if (monAn == null || monAn.TrangThai == false) 
                return NotFound("Món ăn không tồn tại hoặc đã ngừng bán.");

            var danhSachMaTopping = request.DanhSachMaTopping ?? new List<int>();
            var loiTopping = ToppingValidator.KiemTra(monAn, danhSachMaTopping);
            if (loiTopping != null)
                return BadRequest(new { message = loiTopping });

            var gioHang = await LayHoacTaoGioHang(maKhachHang.Value);

            // BẮT BUỘC: Kiểm tra chặn lẫn quán (Chỉ cho phép đặt món của cùng 1 quán)
            if (gioHang.Chitietgiohangs.Any())
            {
                var maNhaHangHienTai = gioHang.Chitietgiohangs.First().MaMonAnNavigation.MaNhaHang;
                if (maNhaHangHienTai != monAn.MaNhaHang)
                {
                    return Conflict("Giỏ hàng của bạn đang chứa món của quán khác. Vui lòng xoá giỏ hàng trước khi đặt món ở quán này.");
                }
            }

            var chiTietMoi = new Chitietgiohang
            {
                MaGioHang = gioHang.MaGioHang,
                MaMonAn = request.MaMonAn,
                SoLuong = request.SoLuong,
                GhiChu = request.GhiChu
            };
            var maToppingDaChon = danhSachMaTopping.ToHashSet();
            foreach (var topping in monAn.MaNhomToppings
                .SelectMany(nhom => nhom.Toppings)
                .Where(topping => maToppingDaChon.Contains(topping.MaTopping)))
            {
                chiTietMoi.ChitietgiohangToppings.Add(new ChitietgiohangTopping
                {
                    MaTopping = topping.MaTopping,
                    SoLuong = 1,
                    GiaThem = topping.GiaThem
                });
            }

            _context.Chitietgiohangs.Add(chiTietMoi);
            gioHang.NgayCapNhat = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Thêm món vào giỏ hàng thành công." });
        }

        [HttpPut("chi-tiet/{id}")]
        public async Task<IActionResult> CapNhatChiTiet(int id, [FromBody] CapNhatChiTietYeuCau request)
        {
            var maKhachHang = await LayMaKhachHang();
            if (maKhachHang == null) return Unauthorized();

            var chiTiet = await _context.Chitietgiohangs
                .Include(ct => ct.MaGioHangNavigation)
                .Include(ct => ct.ChitietgiohangToppings)
                .Include(ct => ct.MaMonAnNavigation)
                    .ThenInclude(m => m.MaNhomToppings)
                    .ThenInclude(nhom => nhom.Toppings)
                .FirstOrDefaultAsync(ct => ct.MaChiTietGioHang == id && ct.MaGioHangNavigation.MaKhachHang == maKhachHang);

            if (chiTiet == null) return NotFound("Không tìm thấy chi tiết giỏ hàng.");

            // Kiểm tra topping hợp lệ nếu có gửi danh sách topping lên
            if (request.DanhSachMaTopping != null)
            {
                var loiTopping = ToppingValidator.KiemTra(chiTiet.MaMonAnNavigation, request.DanhSachMaTopping);
                if (loiTopping != null)
                    return BadRequest(new { message = loiTopping });

                // Xóa topping cũ
                _context.ChitietgiohangToppings.RemoveRange(chiTiet.ChitietgiohangToppings);

                // Thêm topping mới
                var maToppingDaChon = request.DanhSachMaTopping.ToHashSet();
                foreach (var topping in chiTiet.MaMonAnNavigation.MaNhomToppings
                    .SelectMany(nhom => nhom.Toppings)
                    .Where(topping => maToppingDaChon.Contains(topping.MaTopping)))
                {
                    chiTiet.ChitietgiohangToppings.Add(new ChitietgiohangTopping
                    {
                        MaChiTietGioHang = chiTiet.MaChiTietGioHang,
                        MaTopping = topping.MaTopping,
                        SoLuong = 1,
                        GiaThem = topping.GiaThem
                    });
                }
            }

            chiTiet.SoLuong = request.SoLuong;
            if (request.GhiChu != null) 
                chiTiet.GhiChu = request.GhiChu;

            chiTiet.MaGioHangNavigation.NgayCapNhat = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật chi tiết giỏ hàng thành công." });
        }

        [HttpDelete("chi-tiet/{id}")]
        public async Task<IActionResult> XoaMon(int id)
        {
            var maKhachHang = await LayMaKhachHang();
            if (maKhachHang == null) return Unauthorized();

            var chiTiet = await _context.Chitietgiohangs
                .Include(ct => ct.ChitietgiohangToppings)
                .Include(ct => ct.MaGioHangNavigation)
                .FirstOrDefaultAsync(ct => ct.MaChiTietGioHang == id && ct.MaGioHangNavigation.MaKhachHang == maKhachHang);

            if (chiTiet == null) return NotFound("Không tìm thấy món trong giỏ.");

            _context.ChitietgiohangToppings.RemoveRange(chiTiet.ChitietgiohangToppings);
            _context.Chitietgiohangs.Remove(chiTiet);
            
            chiTiet.MaGioHangNavigation.NgayCapNhat = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xoá món khỏi giỏ hàng." });
        }

        [HttpDelete]
        public async Task<IActionResult> XoaSachGioHang()
        {
            var maKhachHang = await LayMaKhachHang();
            if (maKhachHang == null) return Unauthorized();

            var gioHang = await _context.Giohangs
                .Include(g => g.Chitietgiohangs)
                .ThenInclude(ct => ct.ChitietgiohangToppings)
                .FirstOrDefaultAsync(g => g.MaKhachHang == maKhachHang);

            if (gioHang != null)
            {
                foreach (var ct in gioHang.Chitietgiohangs)
                {
                    _context.ChitietgiohangToppings.RemoveRange(ct.ChitietgiohangToppings);
                }
                _context.Chitietgiohangs.RemoveRange(gioHang.Chitietgiohangs);
                gioHang.NgayCapNhat = DateTime.Now;
                await _context.SaveChangesAsync();
            }

            return Ok(new { Message = "Đã xoá sạch giỏ hàng." });
        }
    }

    // --- Các Class DTO ---
    public class ThemMonYeuCau
    {
        [Required] public int MaMonAn { get; set; }
        [Required] [Range(1, 100)] public int SoLuong { get; set; }
        public string? GhiChu { get; set; }
        public List<int>? DanhSachMaTopping { get; set; }
    }

    public class CapNhatChiTietYeuCau
    {
        [Required] [Range(1, 100)] public int SoLuong { get; set; }
        public string? GhiChu { get; set; }
        public List<int>? DanhSachMaTopping { get; set; }
    }
}