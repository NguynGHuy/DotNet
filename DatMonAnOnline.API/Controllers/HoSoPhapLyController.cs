using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers;

[ApiController]
[Route("api/nha-hang/ho-so-phap-ly")]
[Authorize(Roles = "Quan")]
public class HoSoPhapLyController : ControllerBase
{
    private readonly DatMonAnOnlineContext _context;
    private readonly IWebHostEnvironment _environment;

    public HoSoPhapLyController(
        DatMonAnOnlineContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    private int? LayMaTaiKhoan()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(value, out var id) && id > 0
            ? id
            : null;
    }

    private static string? ChuanHoa(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private async Task<bool> DuocChinhSua(Nhahang nhaHang)
    {
        if (nhaHang.TrangThaiDuyet != "ChuaHoanTat" &&
            nhaHang.TrangThaiDuyet != "TuChoi")
        {
            return false;
        }

        return !await _context.Hopdongnhahangs.AnyAsync(x =>
            x.MaNhaHang == nhaHang.MaNhaHang &&
            (x.TrangThai == "DaKy" ||
             x.TrangThai == "ChoDuyet" ||
             x.TrangThai == "HieuLuc"));
    }

    [HttpGet]
    public async Task<IActionResult> LayHoSo()
    {
        var maTaiKhoan = LayMaTaiKhoan();
        if (maTaiKhoan == null) return Unauthorized();

        var nhaHang = await _context.Nhahangs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

        if (nhaHang == null)
            return NotFound(new
            {
                message = "Không tìm thấy nhà hàng của tài khoản này."
            });

        var hoSo = await _context.Hosophaplynhahangs
            .AsNoTracking()
            .Where(x => x.MaNhaHang == nhaHang.MaNhaHang)
            .Select(x => new
            {
                x.NguoiDaiDien,
                x.ChucVuNguoiDaiDien,
                x.SoGiayToNguoiDaiDien,
                x.TenPhapLy,
                x.MaSoThue,
                x.DiaChiPhapLy,
                x.SoGiayPhepKinhDoanh,
                x.FileGiayPhepKinhDoanh,
                x.FileGiayToNguoiDaiDien,
                x.NgayCapNhat
            })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            nhaHang.MaNhaHang,
            nhaHang.TrangThaiDuyet,
            duocChinhSua = await DuocChinhSua(nhaHang),
            hoSo
        });
    }

    [HttpPut]
    public async Task<IActionResult> LuuHoSo(
        [FromBody] LuuHoSoPhapLyRequest request)
    {
        var maTaiKhoan = LayMaTaiKhoan();
        if (maTaiKhoan == null) return Unauthorized();

        var nhaHang = await _context.Nhahangs
            .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

        if (nhaHang == null)
            return NotFound(new
            {
                message = "Không tìm thấy nhà hàng của tài khoản này."
            });

        if (!await DuocChinhSua(nhaHang))
            return Conflict(new
            {
                message = "Hồ sơ đã ký hoặc gửi xét duyệt, không thể chỉnh sửa trực tiếp."
            });

        var hoSo = await _context.Hosophaplynhahangs
            .FirstOrDefaultAsync(x => x.MaNhaHang == nhaHang.MaNhaHang);

        if (hoSo == null)
        {
            hoSo = new Hosophaplynhahang
            {
                MaNhaHang = nhaHang.MaNhaHang,
                NgayTao = DateTime.Now
            };

            _context.Hosophaplynhahangs.Add(hoSo);
        }

        hoSo.NguoiDaiDien = ChuanHoa(request.NguoiDaiDien);
        hoSo.ChucVuNguoiDaiDien = ChuanHoa(request.ChucVuNguoiDaiDien);
        hoSo.SoGiayToNguoiDaiDien = ChuanHoa(request.SoGiayToNguoiDaiDien);
        hoSo.TenPhapLy = ChuanHoa(request.TenPhapLy);
        hoSo.MaSoThue = ChuanHoa(request.MaSoThue);
        hoSo.DiaChiPhapLy = ChuanHoa(request.DiaChiPhapLy);
        hoSo.SoGiayPhepKinhDoanh = ChuanHoa(request.SoGiayPhepKinhDoanh);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã lưu hồ sơ pháp lý.",
            nhaHang.MaNhaHang
        });
    }

    [HttpPost("tep/{loai}")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> TaiGiayTo(
    string loai,
    [FromForm] IFormFile file)
    {
        if (loai != "giay-phep" && loai != "giay-to")
            return BadRequest(new
            {
                message = "Loại giấy tờ không hợp lệ."
            });

        const long dungLuongToiDa = 5 * 1024 * 1024;

        if (file == null || file.Length < 8)
            return BadRequest(new
            {
                message = "Vui lòng chọn tệp hợp lệ."
            });

        if (file.Length > dungLuongToiDa)
            return BadRequest(new
            {
                message = "Dung lượng tệp không được vượt quá 5 MB."
            });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (extension != ".pdf" &&
            extension != ".jpg" &&
            extension != ".jpeg" &&
            extension != ".png")
        {
            return BadRequest(new
            {
                message = "Chỉ hỗ trợ PDF, JPG, JPEG hoặc PNG."
            });
        }

        var maTaiKhoan = LayMaTaiKhoan();
        if (maTaiKhoan == null) return Unauthorized();

        var nhaHang = await _context.Nhahangs
            .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

        if (nhaHang == null)
            return NotFound(new
            {
                message = "Không tìm thấy nhà hàng."
            });

        if (!await DuocChinhSua(nhaHang))
            return Conflict(new
            {
                message = "Hồ sơ đã ký hoặc gửi xét duyệt, không thể thay giấy tờ."
            });

        var hoSo = await _context.Hosophaplynhahangs
            .FirstOrDefaultAsync(x => x.MaNhaHang == nhaHang.MaNhaHang);

        // Đọc phần đầu tệp để kiểm tra định dạng.
        await using var input = file.OpenReadStream();
        var header = new byte[8];
        await input.ReadExactlyAsync(header, HttpContext.RequestAborted);

        var dungDinhDang = extension switch
        {
            ".pdf" => header[0] == 0x25 && header[1] == 0x50 &&
                      header[2] == 0x44 && header[3] == 0x46 &&
                      header[4] == 0x2D,

            ".jpg" or ".jpeg" => header[0] == 0xFF &&
                                header[1] == 0xD8 &&
                                header[2] == 0xFF,

            ".png" => header[0] == 0x89 && header[1] == 0x50 &&
                      header[2] == 0x4E && header[3] == 0x47 &&
                      header[4] == 0x0D && header[5] == 0x0A &&
                      header[6] == 0x1A && header[7] == 0x0A,

            _ => false
        };

        if (!dungDinhDang)
            return BadRequest(new
            {
                message = "Nội dung tệp không đúng định dạng đã chọn."
            });

        if (hoSo == null)
        {
            hoSo = new Hosophaplynhahang
            {
                MaNhaHang = nhaHang.MaNhaHang,
                NgayTao = DateTime.Now
            };

            _context.Hosophaplynhahangs.Add(hoSo);
        }

        var tenTep = $"{Guid.NewGuid():N}{extension}";

        var thuMuc = Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            "HoSoPhapLy",
            nhaHang.MaNhaHang.ToString()
        );

        Directory.CreateDirectory(thuMuc);

        var duongDanVatLy = Path.Combine(thuMuc, tenTep);
        var thamChieuTep = $"{nhaHang.MaNhaHang}/{tenTep}";

        try
        {
            await using (var output = new FileStream(
                duongDanVatLy,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None))
            {
                await output.WriteAsync(header, HttpContext.RequestAborted);
                await input.CopyToAsync(output, HttpContext.RequestAborted);
            }

            if (loai == "giay-phep")
                hoSo.FileGiayPhepKinhDoanh = thamChieuTep;
            else
                hoSo.FileGiayToNguoiDaiDien = thamChieuTep;

            await _context.SaveChangesAsync();
        }
        catch
        {
            if (System.IO.File.Exists(duongDanVatLy))
                System.IO.File.Delete(duongDanVatLy);

            throw;
        }

        return Ok(new
        {
            message = "Đã tải giấy tờ lên.",
            loai,
            tep = thamChieuTep
        });
    }

    [HttpGet("tep/{loai}")]
    public async Task<IActionResult> TaiTepDaLuu(string loai)
    {
        if (loai != "giay-phep" && loai != "giay-to")
            return BadRequest(new
            {
                message = "Loại giấy tờ không hợp lệ."
            });

        var maTaiKhoan = LayMaTaiKhoan();
        if (maTaiKhoan == null) return Unauthorized();

        var nhaHang = await _context.Nhahangs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);

        if (nhaHang == null)
            return NotFound(new
            {
                message = "Không tìm thấy nhà hàng."
            });

        var hoSo = await _context.Hosophaplynhahangs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MaNhaHang == nhaHang.MaNhaHang);

        var thamChieu = loai == "giay-phep"
            ? hoSo?.FileGiayPhepKinhDoanh
            : hoSo?.FileGiayToNguoiDaiDien;

        if (string.IsNullOrWhiteSpace(thamChieu))
            return NotFound(new
            {
                message = "Chưa có tệp giấy tờ."
            });

        var tenTep = Path.GetFileName(thamChieu);

        // Chỉ nhận tham chiếu đúng thư mục của quán hiện tại.
        if (thamChieu != $"{nhaHang.MaNhaHang}/{tenTep}")
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
            _ => null
        };

        if (contentType == null)
            return BadRequest(new
            {
                message = "Định dạng tệp không được hỗ trợ."
            });

        var duongDan = Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            "HoSoPhapLy",
            nhaHang.MaNhaHang.ToString(),
            tenTep
        );

        if (!System.IO.File.Exists(duongDan))
            return NotFound(new
            {
                message = "Không tìm thấy tệp trên máy chủ."
            });

        Response.Headers["Cache-Control"] = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        var tenTaiVe = $"{loai}-nhahang-{nhaHang.MaNhaHang}{extension}";

        return PhysicalFile(duongDan, contentType, tenTaiVe);
    }

}

public class LuuHoSoPhapLyRequest
{
    [MaxLength(100)]
    public string? NguoiDaiDien { get; set; }

    [MaxLength(100)]
    public string? ChucVuNguoiDaiDien { get; set; }

    [MaxLength(30)]
    public string? SoGiayToNguoiDaiDien { get; set; }

    [MaxLength(200)]
    public string? TenPhapLy { get; set; }

    [MaxLength(30)]
    public string? MaSoThue { get; set; }

    [MaxLength(255)]
    public string? DiaChiPhapLy { get; set; }

    [MaxLength(50)]
    public string? SoGiayPhepKinhDoanh { get; set; }
}