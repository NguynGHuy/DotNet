using DatMonAnOnline.API.Common;
using DatMonAnOnline.API.Models;
using DatMonAnOnline.API.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers;

[ApiController]
[Route("api/admin/doi-soat")]
[Authorize(Roles = "Admin")]
public class AdminDoiSoatController : ControllerBase
{
    private readonly DatMonAnOnlineContext _context;
    private readonly DateTime _batDauApDung;

    public AdminDoiSoatController(
        DatMonAnOnlineContext context,
        IOptions<DoiSoatOptions> options)
    {
        _context = context;
        _batDauApDung = options.Value.BatDauApDung;
    }

    [HttpGet]
    public async Task<IActionResult> GetDanhSach([FromQuery] PaginationQuery pagination, [FromQuery] int? maNhaHang)
    {
        var query = _context.Doisoatnhahangs.AsNoTracking().Include(x => x.MaNhaHangNavigation).AsQueryable();
        if (maNhaHang.HasValue) query = query.Where(x => x.MaNhaHang == maNhaHang);

        var list = await query.OrderByDescending(x => x.MaDoiSoat)
            .Select(x => new
            {
                x.MaDoiSoat, x.MaNhaHang, x.MaNhaHangNavigation.TenNhaHang,
                x.TuNgay, x.DenNgay, x.TongSoDon, x.SoTienCanDoiSoat,
                x.TrangThai, x.NgayTao
            }).ToPagedResultAsync(pagination);

        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetChiTiet(int id)
    {
        var doiSoat = await _context.Doisoatnhahangs.AsNoTracking()
            .Include(x => x.MaNhaHangNavigation)
            .Include(x => x.Chitietdoisoats)
            .ThenInclude(ct => ct.Donhang)
            .FirstOrDefaultAsync(x => x.MaDoiSoat == id);

        if (doiSoat == null) return NotFound();

        return Ok(new
        {
            doiSoat.MaDoiSoat, doiSoat.MaNhaHang, doiSoat.MaNhaHangNavigation.TenNhaHang,
            doiSoat.TuNgay, doiSoat.DenNgay, doiSoat.TongSoDon,
            doiSoat.TongTienHang, doiSoat.TongGiamGiaNhaHang, doiSoat.TongGiamGiaHeThong,
            doiSoat.TongPhiNenTang, doiSoat.TongTienNhaHangNhan, doiSoat.TongTienNhaHangDaThu,
            doiSoat.SoTienCanDoiSoat, doiSoat.TrangThai, doiSoat.MaGiaoDichDoiSoat,
            ChiTiet = doiSoat.Chitietdoisoats.Select(ct => new {
                ct.MaDonHang, ct.Donhang.MaDonHangHienThi, ct.Donhang.ThoiGianDat,
                ct.TongTienHang, ct.GiamGiaNhaHang, ct.PhiNenTang, ct.SoTienNhaHangNhan, ct.TienNhaHangDaThu
            })
        });
    }

    public class TaoDoiSoatRequest { public int MaNhaHang { get; set; } public DateOnly TuNgay { get; set; } public DateOnly DenNgay { get; set; } }

    [HttpPost("tao-ky")]
    public async Task<IActionResult> TaoKyDoiSoat([FromBody] TaoDoiSoatRequest req)
    {
        if (req.TuNgay > req.DenNgay || req.DenNgay > DateOnly.FromDateTime(DateTime.Now))
            return BadRequest(new { message = "Khoảng thời gian không hợp lệ." });

        var start = req.TuNgay.ToDateTime(TimeOnly.MinValue);
        var endExclusive = req.DenNgay.AddDays(1).ToDateTime(TimeOnly.MinValue);

        var donHangs = await _context.Donhangs
            .Include(x => x.Thanhtoans).ThenInclude(x => x.MaPhuongThucNavigation)
            .Where(x =>
                x.MaNhaHang == req.MaNhaHang &&
                x.MaTrangThai == 5 &&
                x.MaHopDong != null &&
                x.ThoiGianDat >= _batDauApDung &&
                x.ThoiGianGiaoThucTe.HasValue &&
                x.ThoiGianGiaoThucTe.Value >= start &&
                x.ThoiGianGiaoThucTe.Value < endExclusive &&
                !_context.Chitietdoisoats.Any(ct => ct.MaDonHang == x.MaDonHang))
            .ToListAsync();

        if (!donHangs.Any())
        {
            return BadRequest(new
            {
                message = "Không có đơn hàng hợp lệ nào đã hoàn thành và chưa được đối soát trong khoảng thời gian này."
            });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var doiSoat = new Doisoatnhahang
        {
            MaNhaHang = req.MaNhaHang, TuNgay = req.TuNgay, DenNgay = req.DenNgay,
            TrangThai = "ChoXacNhan", NgayTao = DateTime.Now
        };
        _context.Doisoatnhahangs.Add(doiSoat);
        await _context.SaveChangesAsync();

        foreach (var dh in donHangs)
        {
            var isCod = dh.Thanhtoans.OrderByDescending(t => t.MaThanhToan)
                          .FirstOrDefault()?.MaPhuongThucNavigation.TenPhuongThuc == "COD";
            
            decimal tienNhaHangDaThu = isCod ? dh.ThanhTien : 0;

            var chiTiet = new Chitietdoisoat
            {
                MaDoiSoat = doiSoat.MaDoiSoat, MaDonHang = dh.MaDonHang, MaNhaHang = dh.MaNhaHang,
                TongTienHang = dh.TongTienHang, GiamGiaNhaHang = dh.GiamGiaNhaHang, GiamGiaHeThong = dh.GiamGiaHeThong,
                PhiShip = dh.PhiShip, TyLePhiNenTang = dh.TyLePhiNenTang, PhiNenTang = dh.PhiNenTang,
                SoTienNhaHangNhan = dh.SoTienNhaHangNhan, TienNhaHangDaThu = tienNhaHangDaThu,
                NgayThem = DateTime.Now
            };
            _context.Chitietdoisoats.Add(chiTiet);

            doiSoat.TongSoDon++;
            doiSoat.TongTienHang += dh.TongTienHang;
            doiSoat.TongGiamGiaNhaHang += dh.GiamGiaNhaHang;
            doiSoat.TongGiamGiaHeThong += dh.GiamGiaHeThong;
            doiSoat.TongPhiShip += dh.PhiShip;
            doiSoat.TongPhiNenTang += dh.PhiNenTang;
            doiSoat.TongTienNhaHangNhan += dh.SoTienNhaHangNhan;
            doiSoat.TongTienNhaHangDaThu += tienNhaHangDaThu;
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { message = "Đã tạo kỳ đối soát thành công.", maDoiSoat = doiSoat.MaDoiSoat });
    }

    [HttpPut("{id:int}/thanh-toan")]
    public async Task<IActionResult> ThanhToanDoiSoat(int id, [FromBody] string maGiaoDich)
    {
        var doiSoat = await _context.Doisoatnhahangs.FindAsync(id);
        if (doiSoat == null || doiSoat.TrangThai != "DaXacNhan") return BadRequest("Kỳ đối soát không ở trạng thái hợp lệ.");

        doiSoat.TrangThai = "DaThanhToan";
        doiSoat.NgayThanhToan = DateTime.Now;
        doiSoat.MaGiaoDichDoiSoat = maGiaoDich;
        doiSoat.MaTaiKhoanDuyet = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã cập nhật trạng thái thanh toán." });
    }
}

[ApiController]
[Route("api/nha-hang/doi-soat")]
[Authorize(Roles = "Quan")]
public class QuanDoiSoatController : ControllerBase
{
    private readonly DatMonAnOnlineContext _context;
    public QuanDoiSoatController(DatMonAnOnlineContext context) { _context = context; }

    private async Task<int?> GetMaNhaHang()
    {
        var maTaiKhoan = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return await _context.Nhahangs.Where(n => n.MaTaiKhoan == maTaiKhoan).Select(n => (int?)n.MaNhaHang).FirstOrDefaultAsync();
    }

    [HttpGet]
    public async Task<IActionResult> GetCuaToi([FromQuery] PaginationQuery pagination)
    {
        var maNhaHang = await GetMaNhaHang();
        if (maNhaHang == null) return Unauthorized();

        var list = await _context.Doisoatnhahangs.AsNoTracking().Where(x => x.MaNhaHang == maNhaHang)
            .OrderByDescending(x => x.MaDoiSoat)
            .Select(x => new { x.MaDoiSoat, x.TuNgay, x.DenNgay, x.TongSoDon, x.SoTienCanDoiSoat, x.TrangThai })
            .ToPagedResultAsync(pagination);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetChiTiet(int id)
    {
        var maNhaHang = await GetMaNhaHang();
        var doiSoat = await _context.Doisoatnhahangs.AsNoTracking().Include(x => x.Chitietdoisoats).ThenInclude(ct => ct.Donhang)
            .FirstOrDefaultAsync(x => x.MaDoiSoat == id && x.MaNhaHang == maNhaHang);
        if (doiSoat == null) return NotFound();

        return Ok(new {
            doiSoat.MaDoiSoat, doiSoat.TuNgay, doiSoat.DenNgay, doiSoat.TongSoDon,
            doiSoat.TongTienHang, doiSoat.TongGiamGiaNhaHang, doiSoat.TongPhiNenTang,
            doiSoat.TongTienNhaHangNhan, doiSoat.TongTienNhaHangDaThu, doiSoat.SoTienCanDoiSoat,
            doiSoat.TrangThai, doiSoat.MaGiaoDichDoiSoat,
            ChiTiet = doiSoat.Chitietdoisoats.Select(ct => new {
                ct.MaDonHang, ct.Donhang.MaDonHangHienThi, ct.TongTienHang, ct.GiamGiaNhaHang, ct.PhiNenTang, ct.SoTienCanDoiSoat
            })
        });
    }

    [HttpPut("{id:int}/xac-nhan")]
    public async Task<IActionResult> XacNhanDoiSoat(int id)
    {
        var maNhaHang = await GetMaNhaHang();
        var doiSoat = await _context.Doisoatnhahangs.FirstOrDefaultAsync(x => x.MaDoiSoat == id && x.MaNhaHang == maNhaHang);
        if (doiSoat == null || doiSoat.TrangThai != "ChoXacNhan") return BadRequest("Phiếu không hợp lệ.");

        doiSoat.TrangThai = "DaXacNhan";
        doiSoat.NgayXacNhan = DateTime.Now;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã xác nhận số liệu đối soát." });
    }
}
