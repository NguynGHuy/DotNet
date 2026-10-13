using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DatMonAnOnline.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminHopDongController : ControllerBase
{
    private readonly DatMonAnOnlineContext _context;
    private readonly IWebHostEnvironment _environment;

    public AdminHopDongController(
        DatMonAnOnlineContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet("nha-hang/{id:int}/hop-dong")]
    public async Task<IActionResult> XemHoSoHopDong(int id)
    {
        var nhaHang = await _context.Nhahangs
            .AsNoTracking()
            .Where(x => x.MaNhaHang == id)
            .Select(x => new
            {
                x.MaNhaHang,
                x.TenNhaHang,
                x.DiaChiQuan,
                x.MoTa,
                x.AnhBia,
                x.GioMoCua,
                x.GioDongCua,
                x.TrangThaiDuyet,
                email = x.MaTaiKhoanNavigation.Email,
                soDienThoai = x.MaTaiKhoanNavigation.SoDienThoai
            })
            .FirstOrDefaultAsync();

        if (nhaHang == null)
            return NotFound(new
            {
                message = "Không tìm thấy nhà hàng."
            });

        var hopDong = await _context.Hopdongnhahangs
            .AsNoTracking()
            .Where(x => x.MaNhaHang == id)
            .OrderByDescending(x => x.MaHopDong)
            .Select(x => new
            {
                x.MaHopDong,
                x.MaNhaHang,
                x.SoHopDong,
                x.TrangThai,
                x.NguoiDaiDien,
                x.ChucVuNguoiDaiDien,
                x.SoGiayToNguoiDaiDien,
                x.TenPhapLy,
                x.MaSoThue,
                x.DiaChiPhapLy,
                x.SoGiayPhepKinhDoanh,
                x.PhienBanDieuKhoan,
                x.TyLePhiNenTang,
                x.NgayBatDau,
                x.NgayKetThuc,
                x.ThoiGianKy,
                x.ThoiGianDongYDieuKhoan,
                x.ThoiGianGuiDuyet,
                x.ThoiGianDuyet,
                x.MaTaiKhoanDuyet,
                x.LyDoTuChoi,
                x.NoiDungHopDong,
                coGiayPhep = x.FileGiayPhepKinhDoanh != null,
                coGiayToDaiDien = x.FileGiayToNguoiDaiDien != null,
                coTepHopDong = x.FileHopDong != null
            })
            .FirstOrDefaultAsync();

        var thamDinh = hopDong == null
            ? null
            : await _context.Thamdinhhosonhahangs
                .AsNoTracking()
                .Where(x => x.MaHopDong == hopDong.MaHopDong)
                .Select(x => new
                {
                    x.KetQuaGiayPhep,
                    x.KetQuaGiayToDaiDien,
                    x.KetQuaHopDong,
                    x.KetQua,
                    x.GhiChu,
                    x.ThoiGian,
                    x.MaTaiKhoanAdmin
                })
                .FirstOrDefaultAsync();

        return Ok(new { nhaHang, hopDong, thamDinh });
    }

    [HttpGet("hop-dong/{id:int}/tep/{loai}")]
    public async Task<IActionResult> TaiTepHopDong(int id, string loai)
    {
        if (loai != "giay-phep" &&
            loai != "giay-to" &&
            loai != "hop-dong")
        {
            return BadRequest(new
            {
                message = "Loại tệp không hợp lệ."
            });
        }

        var hopDong = await _context.Hopdongnhahangs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MaHopDong == id);

        if (hopDong == null)
            return NotFound(new
            {
                message = "Không tìm thấy hợp đồng."
            });

        var thamChieu = loai switch
        {
            "giay-phep" => hopDong.FileGiayPhepKinhDoanh,
            "giay-to" => hopDong.FileGiayToNguoiDaiDien,
            _ => hopDong.FileHopDong
        };

        if (string.IsNullOrWhiteSpace(thamChieu))
            return NotFound(new
            {
                message = "Hợp đồng chưa có tệp này."
            });

        var tenTep = Path.GetFileName(thamChieu);

        if (thamChieu != $"{hopDong.MaNhaHang}/{tenTep}")
            return BadRequest(new
            {
                message = "Tham chiếu tệp không hợp lệ."
            });

        var extension = Path.GetExtension(tenTep).ToLowerInvariant();

        var contentType = extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".txt" => "text/plain; charset=utf-8",
            _ => null
        };

        if (contentType == null)
            return BadRequest(new
            {
                message = "Định dạng tệp không được hỗ trợ."
            });

        var thuMuc = loai == "hop-dong"
            ? "HopDong"
            : "HoSoPhapLy";

        var duongDan = Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            thuMuc,
            hopDong.MaNhaHang.ToString(),
            tenTep
        );

        if (!System.IO.File.Exists(duongDan))
            return NotFound(new
            {
                message = "Không tìm thấy tệp trên máy chủ."
            });

        Response.Headers["Cache-Control"] = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        return PhysicalFile(
            duongDan,
            contentType,
            $"{loai}-nhahang-{hopDong.MaNhaHang}{extension}"
        );
    }
}
