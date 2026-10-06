using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers;

[Route("api/gio-hang")]
[ApiController]
[Authorize(Roles = "KhachHang")]
public class GioHangController : ControllerBase
{
    private readonly DatMonAnOnlineContext _context;

    public GioHangController(DatMonAnOnlineContext context) => _context = context;

    private async Task<int?> LayMaKhachHang()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userId, out var maTaiKhoan)) return null;

        return await _context.Khachhangs
            .Where(kh => kh.MaTaiKhoan == maTaiKhoan)
            .Select(kh => (int?)kh.MaKhachHang)
            .FirstOrDefaultAsync();
    }

    private IQueryable<Giohang> TruyVanGioHangDayDu()
    {
        return _context.Giohangs
            .Include(g => g.MaNhaHangNavigation)
            .Include(g => g.Chitietgiohangs)
                .ThenInclude(ct => ct.MaMonAnNavigation)
            .Include(g => g.Chitietgiohangs)
                .ThenInclude(ct => ct.ChitietgiohangToppings)
                    .ThenInclude(tp => tp.MaToppingNavigation);
    }

    private static object TaoDuLieuGioHang(Giohang gioHang)
    {
        var chiTiet = gioHang.Chitietgiohangs
            .OrderBy(ct => ct.MaChiTietGioHang)
            .Select(ct => new
            {
                ct.MaChiTietGioHang,
                ct.MaMonAn,
                ct.MaMonAnNavigation.TenMonAn,
                ct.MaMonAnNavigation.HinhAnh,
                DonGia = ct.MaMonAnNavigation.Gia,
                ct.SoLuong,
                ct.GhiChu,
                Toppings = ct.ChitietgiohangToppings.Select(tp => new
                {
                    tp.MaTopping,
                    tp.MaToppingNavigation.TenTopping,
                    tp.GiaThem,
                    tp.SoLuong
                }).ToList(),
                ThanhTien = (ct.MaMonAnNavigation.Gia +
                    ct.ChitietgiohangToppings.Sum(tp => tp.GiaThem * tp.SoLuong)) * ct.SoLuong
            })
            .ToList();

        return new
        {
            gioHang.MaGioHang,
            gioHang.MaNhaHang,
            gioHang.MaNhaHangNavigation.TenNhaHang,
            gioHang.MaNhaHangNavigation.AnhBia,
            gioHang.NgayCapNhat,
            SoLuongMon = chiTiet.Sum(ct => ct.SoLuong),
            TongTienTamTinh = chiTiet.Sum(ct => ct.ThanhTien),
            ChiTiet = chiTiet
        };
    }

    // Chỉ đọc giỏ của nhà hàng đang mở trên giao diện.
    // Chưa thêm món thì trả về giỏ rỗng, không tạo dòng dư trong database.
    [HttpGet("nha-hang/{maNhaHang:int}")]
    public async Task<IActionResult> XemGioHangTheoNhaHang(int maNhaHang)
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null)
            return Unauthorized(new { message = "Không tìm thấy thông tin khách hàng." });

        var gioHang = await TruyVanGioHangDayDu()
            .AsNoTracking()
            .FirstOrDefaultAsync(g =>
                g.MaKhachHang == maKhachHang.Value &&
                g.MaNhaHang == maNhaHang);

        if (gioHang != null)
            return Ok(TaoDuLieuGioHang(gioHang));

        var nhaHang = await _context.Nhahangs
            .AsNoTracking()
            .Where(nh => nh.MaNhaHang == maNhaHang && nh.TrangThaiDuyet == "DaDuyet")
            .Select(nh => new { nh.MaNhaHang, nh.TenNhaHang, nh.AnhBia })
            .FirstOrDefaultAsync();

        if (nhaHang == null)
            return NotFound(new { message = "Không tìm thấy nhà hàng." });

        return Ok(new
        {
            MaGioHang = (int?)null,
            nhaHang.MaNhaHang,
            nhaHang.TenNhaHang,
            nhaHang.AnhBia,
            NgayCapNhat = (DateTime?)null,
            SoLuongMon = 0,
            TongTienTamTinh = 0m,
            ChiTiet = Array.Empty<object>()
        });
    }

    // Trả về giỏ còn món được người dùng thao tác gần đây nhất.
    // Dùng để hiển thị thanh giỏ hàng nhanh ở trang chủ.
    [HttpGet("gan-nhat")]
    public async Task<IActionResult> XemGioHangGanNhat()
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null)
            return Unauthorized(new { message = "Không tìm thấy thông tin khách hàng." });

        var gioHang = await TruyVanGioHangDayDu()
            .AsNoTracking()
            .Where(g =>
                g.MaKhachHang == maKhachHang.Value &&
                g.Chitietgiohangs.Any())
            .OrderByDescending(g => g.NgayCapNhat)
            .ThenByDescending(g => g.MaGioHang)
            .FirstOrDefaultAsync();

        if (gioHang == null)
            return NoContent();

        return Ok(TaoDuLieuGioHang(gioHang));
    }

    // Dùng ở checkout và luôn kiểm tra giỏ thuộc khách đang đăng nhập.
    [HttpGet("{maGioHang:int}")]
    public async Task<IActionResult> XemGioHang(int maGioHang)
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null) return Unauthorized();

        var gioHang = await TruyVanGioHangDayDu()
            .AsNoTracking()
            .FirstOrDefaultAsync(g =>
                g.MaGioHang == maGioHang &&
                g.MaKhachHang == maKhachHang.Value);

        if (gioHang == null)
            return NotFound(new { message = "Không tìm thấy giỏ hàng." });

        return Ok(TaoDuLieuGioHang(gioHang));
    }

    [HttpPost("them-mon")]
    public async Task<IActionResult> ThemMonVaoGio([FromBody] ThemMonYeuCau request)
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null) return Unauthorized();

        var monAn = await _context.Monans
            .Include(m => m.MaNhaHangNavigation)
            .Include(m => m.MaNhomToppings)
                .ThenInclude(nhom => nhom.Toppings)
            .FirstOrDefaultAsync(m => m.MaMonAn == request.MaMonAn);

        if (monAn == null || monAn.TrangThai != true)
            return NotFound(new { message = "Món ăn không tồn tại hoặc đã ngừng bán." });

        if (monAn.MaNhaHangNavigation.TrangThaiDuyet != "DaDuyet" ||
            monAn.MaNhaHangNavigation.TrangThaiHoatDong != "MoCua")
        {
            return BadRequest(new { message = "Nhà hàng hiện không nhận đơn." });
        }

        var toppingDaChon = (request.DanhSachMaTopping ?? new List<int>())
            .Distinct()
            .ToHashSet();

        var toppingHopLe = monAn.MaNhomToppings
            .SelectMany(nhom => nhom.Toppings)
            .Where(tp => tp.TrangThai == true)
            .ToDictionary(tp => tp.MaTopping);

        if (toppingDaChon.Any(id => !toppingHopLe.ContainsKey(id)))
            return BadRequest(new { message = "Có topping không hợp lệ hoặc đã ngừng bán." });

        foreach (var nhom in monAn.MaNhomToppings)
        {
            var soLuongDaChon = nhom.Toppings.Count(tp => toppingDaChon.Contains(tp.MaTopping));

            if (nhom.BatBuocChon && soLuongDaChon == 0)
                return BadRequest(new { message = $"Vui lòng chọn topping cho nhóm {nhom.TenNhom}." });

            if (nhom.ChonToiDa.HasValue && soLuongDaChon > nhom.ChonToiDa.Value)
                return BadRequest(new { message = $"Nhóm {nhom.TenNhom} chỉ được chọn tối đa {nhom.ChonToiDa} topping." });
        }

        var gioHang = await _context.Giohangs.FirstOrDefaultAsync(g =>
            g.MaKhachHang == maKhachHang.Value &&
            g.MaNhaHang == monAn.MaNhaHang);

        if (gioHang == null)
        {
            gioHang = new Giohang
            {
                MaKhachHang = maKhachHang.Value,
                MaNhaHang = monAn.MaNhaHang,
                NgayCapNhat = DateTime.Now
            };
            _context.Giohangs.Add(gioHang);
        }

        var chiTiet = new Chitietgiohang
        {
            MaGioHangNavigation = gioHang,
            MaMonAn = monAn.MaMonAn,
            SoLuong = request.SoLuong,
            GhiChu = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim()
        };

        foreach (var maTopping in toppingDaChon)
        {
            var topping = toppingHopLe[maTopping];
            chiTiet.ChitietgiohangToppings.Add(new ChitietgiohangTopping
            {
                MaTopping = topping.MaTopping,
                SoLuong = 1,
                GiaThem = topping.GiaThem
            });
        }

        _context.Chitietgiohangs.Add(chiTiet);
        gioHang.NgayCapNhat = DateTime.Now;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã thêm món vào giỏ của nhà hàng này.",
            gioHang.MaGioHang,
            gioHang.MaNhaHang
        });
    }

    [HttpPut("chi-tiet/{id:int}")]
    public async Task<IActionResult> SuaSoLuong(int id, [FromBody] SuaSoLuongYeuCau request)
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null) return Unauthorized();

        var chiTiet = await _context.Chitietgiohangs
            .Include(ct => ct.MaGioHangNavigation)
            .FirstOrDefaultAsync(ct =>
                ct.MaChiTietGioHang == id &&
                ct.MaGioHangNavigation.MaKhachHang == maKhachHang.Value);

        if (chiTiet == null)
            return NotFound(new { message = "Không tìm thấy món trong giỏ." });

        chiTiet.SoLuong = request.SoLuong;
        chiTiet.MaGioHangNavigation.NgayCapNhat = DateTime.Now;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Cập nhật số lượng thành công." });
    }

    [HttpPut("chi-tiet/{id:int}/tuy-chon")]
    public async Task<IActionResult> SuaTuyChonMon(
        int id,
        [FromBody] SuaTuyChonYeuCau request)
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null) return Unauthorized();

        var chiTiet = await _context.Chitietgiohangs
            .Include(ct => ct.MaGioHangNavigation)
            .Include(ct => ct.ChitietgiohangToppings)
            .Include(ct => ct.MaMonAnNavigation)
                .ThenInclude(mon => mon.MaNhomToppings)
                    .ThenInclude(nhom => nhom.Toppings)
            .FirstOrDefaultAsync(ct =>
                ct.MaChiTietGioHang == id &&
                ct.MaGioHangNavigation.MaKhachHang == maKhachHang.Value);

        if (chiTiet == null)
            return NotFound(new { message = "Không tìm thấy món trong giỏ." });

        if (chiTiet.MaMonAnNavigation.TrangThai != true)
            return BadRequest(new { message = "Món ăn này đã ngừng bán." });

        var toppingDaChon = (request.DanhSachMaTopping ?? new List<int>())
            .Distinct()
            .ToHashSet();

        var toppingHopLe = chiTiet.MaMonAnNavigation.MaNhomToppings
            .SelectMany(nhom => nhom.Toppings)
            .Where(tp => tp.TrangThai == true)
            .ToDictionary(tp => tp.MaTopping);

        if (toppingDaChon.Any(idTopping => !toppingHopLe.ContainsKey(idTopping)))
            return BadRequest(new { message = "Có topping không hợp lệ hoặc đã ngừng bán." });

        foreach (var nhom in chiTiet.MaMonAnNavigation.MaNhomToppings)
        {
            var soLuongDaChon = nhom.Toppings.Count(tp => toppingDaChon.Contains(tp.MaTopping));

            if (nhom.BatBuocChon && soLuongDaChon == 0)
                return BadRequest(new { message = $"Vui lòng chọn topping cho nhóm {nhom.TenNhom}." });

            if (nhom.ChonToiDa.HasValue && soLuongDaChon > nhom.ChonToiDa.Value)
                return BadRequest(new { message = $"Nhóm {nhom.TenNhom} chỉ được chọn tối đa {nhom.ChonToiDa} topping." });
        }

        var toppingCanXoa = chiTiet.ChitietgiohangToppings
            .Where(tp => !toppingDaChon.Contains(tp.MaTopping))
            .ToList();
        _context.ChitietgiohangToppings.RemoveRange(toppingCanXoa);

        foreach (var maTopping in toppingDaChon)
        {
            var topping = toppingHopLe[maTopping];
            var toppingHienTai = chiTiet.ChitietgiohangToppings
                .FirstOrDefault(tp => tp.MaTopping == maTopping);

            if (toppingHienTai == null)
            {
                chiTiet.ChitietgiohangToppings.Add(new ChitietgiohangTopping
                {
                    MaTopping = topping.MaTopping,
                    SoLuong = 1,
                    GiaThem = topping.GiaThem
                });
            }
            else
            {
                toppingHienTai.SoLuong = 1;
                toppingHienTai.GiaThem = topping.GiaThem;
            }
        }

        chiTiet.GhiChu = string.IsNullOrWhiteSpace(request.GhiChu)
            ? null
            : request.GhiChu.Trim();
        chiTiet.MaGioHangNavigation.NgayCapNhat = DateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã cập nhật topping và ghi chú." });
    }

    [HttpDelete("chi-tiet/{id:int}")]
    public async Task<IActionResult> XoaMon(int id)
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null) return Unauthorized();

        var chiTiet = await _context.Chitietgiohangs
            .Include(ct => ct.ChitietgiohangToppings)
            .Include(ct => ct.MaGioHangNavigation)
            .FirstOrDefaultAsync(ct =>
                ct.MaChiTietGioHang == id &&
                ct.MaGioHangNavigation.MaKhachHang == maKhachHang.Value);

        if (chiTiet == null)
            return NotFound(new { message = "Không tìm thấy món trong giỏ." });

        chiTiet.MaGioHangNavigation.NgayCapNhat = DateTime.Now;
        _context.ChitietgiohangToppings.RemoveRange(chiTiet.ChitietgiohangToppings);
        _context.Chitietgiohangs.Remove(chiTiet);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa món khỏi giỏ hàng." });
    }

    // Chỉ xóa giỏ được chọn, không ảnh hưởng giỏ của nhà hàng khác.
    [HttpDelete("{maGioHang:int}")]
    public async Task<IActionResult> XoaSachGioHang(int maGioHang)
    {
        var maKhachHang = await LayMaKhachHang();
        if (maKhachHang == null) return Unauthorized();

        var gioHang = await _context.Giohangs
            .Include(g => g.Chitietgiohangs)
                .ThenInclude(ct => ct.ChitietgiohangToppings)
            .FirstOrDefaultAsync(g =>
                g.MaGioHang == maGioHang &&
                g.MaKhachHang == maKhachHang.Value);

        if (gioHang == null)
            return NotFound(new { message = "Không tìm thấy giỏ hàng." });

        foreach (var chiTiet in gioHang.Chitietgiohangs)
            _context.ChitietgiohangToppings.RemoveRange(chiTiet.ChitietgiohangToppings);

        _context.Chitietgiohangs.RemoveRange(gioHang.Chitietgiohangs);
        gioHang.NgayCapNhat = DateTime.Now;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa các món trong giỏ của nhà hàng này." });
    }
}

public class ThemMonYeuCau
{
    [Range(1, int.MaxValue)]
    public int MaMonAn { get; set; }

    [Range(1, 100)]
    public int SoLuong { get; set; }

    [MaxLength(300)]
    public string? GhiChu { get; set; }

    public List<int>? DanhSachMaTopping { get; set; }
}

public class SuaSoLuongYeuCau
{
    [Range(1, 100)]
    public int SoLuong { get; set; }
}

public class SuaTuyChonYeuCau
{
    [MaxLength(300)]
    public string? GhiChu { get; set; }

    public List<int>? DanhSachMaTopping { get; set; }
}
