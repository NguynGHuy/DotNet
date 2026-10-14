using DatMonAnOnline.API.Common;
using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [ApiController]
    [Route("api/khuyen-mai")]
    public class KhuyenMaiController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public KhuyenMaiController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0"
            );
        }

        private async Task<bool> CoQuyenQuanLyKhuyenMai(Khuyenmai km)
        {
            if (User.IsInRole("Admin"))
                return true;

            if (!User.IsInRole("Quan") || !km.MaNhaHang.HasValue)
                return false;

            var maTaiKhoan = GetCurrentUserId();

            return await _context.Nhahangs.AnyAsync(n =>
                n.MaTaiKhoan == maTaiKhoan &&
                n.MaNhaHang == km.MaNhaHang.Value
            );
        }

        private async Task<int?> GetCurrentCustomerId()
        {
            if (!User.IsInRole("KhachHang"))
                return null;

            var maTaiKhoan = GetCurrentUserId();
            return await _context.Khachhangs
                .AsNoTracking()
                .Where(x => x.MaTaiKhoan == maTaiKhoan)
                .Select(x => (int?)x.MaKhachHang)
                .FirstOrDefaultAsync();
        }

        // Voucher đang phát hành tại một nhà hàng. Khách chưa đăng nhập vẫn xem được.
        [HttpGet("nha-hang/{maNhaHang:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> LayVoucherCuaNhaHang(
            int maNhaHang,
            [FromQuery] PaginationQuery pagination)
        {
            var now = DateTime.Now;
            var maKhachHang = await GetCurrentCustomerId();

            var result = await _context.Khuyenmais
                .AsNoTracking()
                .Where(x =>
                    x.MaNhaHang == maNhaHang &&
                    x.TrangThai == true &&
                    x.NgayBatDau <= now &&
                    x.NgayKetThuc >= now &&
                    x.SoLuongDaDung < x.SoLuong)
                .OrderBy(x => x.NgayKetThuc)
                .ThenByDescending(x => x.GiaTriGiam)
                .Select(x => new
                {
                    x.MaKhuyenMai,
                    x.MaCode,
                    x.MoTa,
                    x.LoaiGiam,
                    x.GiaTriGiam,
                    x.GiamToiDa,
                    x.DonHangToiThieu,
                    x.SoLuong,
                    x.SoLuongDaDung,
                    x.NgayBatDau,
                    x.NgayKetThuc,
                    x.MaNhaHang,
                    TenNhaHang = x.MaNhaHangNavigation!.TenNhaHang,
                    Nguon = "NhaHang",
                    DaLuu = maKhachHang.HasValue && x.KhachhangKhuyenmais
                        .Any(item => item.MaKhachHang == maKhachHang.Value)
                })
                .ToPagedResultAsync(pagination);

            return Ok(result);
        }

        // Voucher toàn hệ thống để khách lưu vào kho.
        [HttpGet("he-thong")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> LayVoucherHeThong(
            [FromQuery] PaginationQuery pagination)
        {
            var now = DateTime.Now;
            var maKhachHang = await GetCurrentCustomerId();
            if (!maKhachHang.HasValue)
                return Unauthorized(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var query = await _context.Khuyenmais
                .AsNoTracking()
                .Where(x =>
                    x.MaNhaHang == null &&
                    x.TrangThai == true &&
                    x.NgayBatDau <= now &&
                    x.NgayKetThuc >= now &&
                    x.SoLuongDaDung < x.SoLuong)
                .OrderBy(x => x.NgayKetThuc)
                .ThenByDescending(x => x.GiaTriGiam)
                .Select(x => new
                {
                    x.MaKhuyenMai,
                    x.MaCode,
                    x.MoTa,
                    x.LoaiGiam,
                    x.GiaTriGiam,
                    x.GiamToiDa,
                    x.DonHangToiThieu,
                    x.SoLuong,
                    x.SoLuongDaDung,
                    x.NgayBatDau,
                    x.NgayKetThuc,
                    x.MaNhaHang,
                    TenNhaHang = (string?)null,
                    Nguon = "HeThong",
                    DaLuu = x.KhachhangKhuyenmais
                        .Any(item => item.MaKhachHang == maKhachHang.Value)
                })
                .ToPagedResultAsync(pagination);

            return Ok(query);
        }

        // Kho voucher của khách. Khi checkout chỉ trả voucher hệ thống và đúng nhà hàng.
        [HttpGet("kho-cua-toi")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> LayKhoVoucher(
            [FromQuery] PaginationQuery pagination,
            [FromQuery] int? maNhaHang = null,
            [FromQuery] bool usableOnly = false)
        {
            var now = DateTime.Now;
            var maKhachHang = await GetCurrentCustomerId();
            if (!maKhachHang.HasValue)
                return Unauthorized(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var query = _context.KhachhangKhuyenmais
                .AsNoTracking()
                .Where(x => x.MaKhachHang == maKhachHang.Value);

            if (maNhaHang.HasValue)
            {
                query = query.Where(x =>
                    x.MaKhuyenMaiNavigation.MaNhaHang == null ||
                    x.MaKhuyenMaiNavigation.MaNhaHang == maNhaHang.Value);
            }

            if (usableOnly)
            {
                query = query.Where(x =>
                    x.MaKhuyenMaiNavigation.TrangThai == true &&
                    x.MaKhuyenMaiNavigation.NgayBatDau <= now &&
                    x.MaKhuyenMaiNavigation.NgayKetThuc >= now &&
                    x.MaKhuyenMaiNavigation.SoLuongDaDung < x.MaKhuyenMaiNavigation.SoLuong);
            }

            var result = await query
                .OrderByDescending(x => x.NgayLuu)
                .Select(x => new
                {
                    x.MaKhuyenMai,
                    x.MaKhuyenMaiNavigation.MaCode,
                    x.MaKhuyenMaiNavigation.MoTa,
                    x.MaKhuyenMaiNavigation.LoaiGiam,
                    x.MaKhuyenMaiNavigation.GiaTriGiam,
                    x.MaKhuyenMaiNavigation.GiamToiDa,
                    x.MaKhuyenMaiNavigation.DonHangToiThieu,
                    x.MaKhuyenMaiNavigation.SoLuong,
                    x.MaKhuyenMaiNavigation.SoLuongDaDung,
                    x.MaKhuyenMaiNavigation.NgayBatDau,
                    x.MaKhuyenMaiNavigation.NgayKetThuc,
                    x.MaKhuyenMaiNavigation.MaNhaHang,
                    TenNhaHang = x.MaKhuyenMaiNavigation.MaNhaHangNavigation != null
                        ? x.MaKhuyenMaiNavigation.MaNhaHangNavigation.TenNhaHang
                        : null,
                    Nguon = x.MaKhuyenMaiNavigation.MaNhaHang == null ? "HeThong" : "NhaHang",
                    DaLuu = true,
                    x.NgayLuu,
                    CoTheSuDung =
                        x.MaKhuyenMaiNavigation.TrangThai == true &&
                        x.MaKhuyenMaiNavigation.NgayBatDau <= now &&
                        x.MaKhuyenMaiNavigation.NgayKetThuc >= now &&
                        x.MaKhuyenMaiNavigation.SoLuongDaDung < x.MaKhuyenMaiNavigation.SoLuong
                })
                .ToPagedResultAsync(pagination);

            return Ok(result);
        }

        [HttpPost("{id:int}/luu")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> LuuVoucher(int id)
        {
            var maKhachHang = await GetCurrentCustomerId();
            if (!maKhachHang.HasValue)
                return Unauthorized(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var now = DateTime.Now;
            var voucher = await _context.Khuyenmais
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MaKhuyenMai == id);

            if (voucher == null)
                return NotFound(new { message = "Không tìm thấy voucher." });

            if (voucher.TrangThai != true || voucher.NgayBatDau > now || voucher.NgayKetThuc < now || voucher.SoLuongDaDung >= voucher.SoLuong)
                return BadRequest(new { message = "Voucher hiện không còn khả dụng để lưu." });

            var daLuu = await _context.KhachhangKhuyenmais.AnyAsync(x =>
                x.MaKhachHang == maKhachHang.Value && x.MaKhuyenMai == id);

            if (daLuu)
                return Ok(new { message = "Voucher đã có trong kho của bạn." });

            _context.KhachhangKhuyenmais.Add(new KhachhangKhuyenmai
            {
                MaKhachHang = maKhachHang.Value,
                MaKhuyenMai = id,
                NgayLuu = now
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã lưu voucher vào kho." });
        }

        [HttpDelete("{id:int}/bo-luu")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> BoLuuVoucher(int id)
        {
            var maKhachHang = await GetCurrentCustomerId();
            if (!maKhachHang.HasValue)
                return Unauthorized(new { message = "Không tìm thấy hồ sơ khách hàng." });

            var saved = await _context.KhachhangKhuyenmais.FirstOrDefaultAsync(x =>
                x.MaKhachHang == maKhachHang.Value && x.MaKhuyenMai == id);

            if (saved == null)
                return NotFound(new { message = "Voucher không có trong kho." });

            _context.KhachhangKhuyenmais.Remove(saved);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã bỏ voucher khỏi kho." });
        }

        // =========================
        // TẠO KHUYẾN MÃI
        // =========================

        [HttpPost]
        [Authorize(Roles = "Quan,Admin")]
        public async Task<IActionResult> TaoKhuyenMai(
            [FromBody] TaoKhuyenMaiRequest request)
        {
            PromotionWriteHelper.Normalize(request);
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            int? maNhaHang = null;

            if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs
                    .FirstOrDefaultAsync(
                        n => n.MaTaiKhoan == GetCurrentUserId()
                    );

                if (nhaHang == null)
                    return BadRequest("Không tìm thấy thông tin nhà hàng.");

                maNhaHang = nhaHang.MaNhaHang;
            }
            else if (role == "Admin")
            {
                // null = khuyến mãi toàn sàn
                maNhaHang = null;
            }

            var khuyenMai = new Khuyenmai
            {
                MaCode = request.MaCode,
                MoTa = request.MoTa,
                SoLuong = request.SoLuong,
                NgayBatDau = request.NgayBatDau,
                NgayKetThuc = request.NgayKetThuc,
                DonHangToiThieu = request.DonHangToiThieu,
                LoaiGiam = request.LoaiGiam,
                GiaTriGiam = request.GiaTriGiam,
                GiamToiDa = request.GiamToiDa,

                MaNhaHang = maNhaHang,

                TrangThai = true,
                SoLuongDaDung = 0
            };

            _context.Khuyenmais.Add(khuyenMai);

            if (!await PromotionWriteHelper.SaveNewAsync(_context))
            {
                return Conflict(new
                {
                    message = "Mã khuyến mãi đã tồn tại."
                });
            }

            return Ok(new
            {
                message = "Tạo mã khuyến mãi thành công",
                data = new
                {
                    khuyenMai.MaKhuyenMai,
                    khuyenMai.MaCode,
                    khuyenMai.MoTa,
                    khuyenMai.SoLuong,
                    khuyenMai.SoLuongDaDung,
                    khuyenMai.NgayBatDau,
                    khuyenMai.NgayKetThuc,
                    khuyenMai.DonHangToiThieu,
                    khuyenMai.LoaiGiam,
                    khuyenMai.GiaTriGiam,
                    khuyenMai.GiamToiDa,
                    khuyenMai.MaNhaHang,
                    khuyenMai.TrangThai
                }
            });
        }

        // =========================
        // LẤY KHUYẾN MÃI CỦA NHÀ HÀNG
        // =========================

        [HttpGet("cua-toi")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> LayDanhSachKhuyenMaiCuaQuan(
            [FromQuery] PaginationQuery pagination,
            [FromQuery] string? search = null,
            [FromQuery] string? state = null)
        {
            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(
                    n => n.MaTaiKhoan == GetCurrentUserId()
                );

            if (nhaHang == null)
                return BadRequest("Không tìm thấy thông tin nhà hàng.");

            var now = DateTime.Now;
            var query = _context.Khuyenmais
                .AsNoTracking()
                .Where(x => x.MaNhaHang == nhaHang.MaNhaHang);

            var counts = new
            {
                all = await query.CountAsync(),
                active = await query.CountAsync(x => x.TrangThai == true && x.NgayBatDau <= now && x.NgayKetThuc >= now),
                upcoming = await query.CountAsync(x => x.TrangThai == true && x.NgayBatDau > now),
                ended = await query.CountAsync(x => x.TrangThai != true || x.NgayKetThuc < now),
                inactive = await query.CountAsync(x => x.TrangThai != true),
                expired = await query.CountAsync(x => x.TrangThai == true && x.NgayKetThuc < now)
            };

            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim();
                query = query.Where(x =>
                    x.MaCode.Contains(keyword) ||
                    (x.MoTa != null && x.MoTa.Contains(keyword)));
            }

            query = state?.Trim().ToLowerInvariant() switch
            {
                "active" => query.Where(x => x.TrangThai == true && x.NgayBatDau <= now && x.NgayKetThuc >= now),
                "upcoming" => query.Where(x => x.TrangThai == true && x.NgayBatDau > now),
                "ended" => query.Where(x => x.TrangThai != true || x.NgayKetThuc < now),
                _ => query
            };

            var list = await query
                .OrderByDescending(x => x.MaKhuyenMai)
                .Select(x => new
                {
                    x.MaKhuyenMai,
                    x.MaCode,
                    x.MoTa,
                    x.SoLuong,
                    x.SoLuongDaDung,
                    x.NgayBatDau,
                    x.NgayKetThuc,
                    x.DonHangToiThieu,
                    x.LoaiGiam,
                    x.GiaTriGiam,
                    x.GiamToiDa,
                    x.MaNhaHang,
                    x.TrangThai
                })
                .ToPagedResultAsync(pagination);

            return Ok(new
            {
                list.Items,
                list.PageNumber,
                list.PageSize,
                list.TotalItems,
                list.TotalPages,
                list.HasPreviousPage,
                list.HasNextPage,
                counts
            });
        }

        // =========================
        // CẬP NHẬT KHUYẾN MÃI
        // =========================

        [HttpPut("{id}")]
        [Authorize(Roles = "Quan,Admin")]
        public async Task<IActionResult> CapNhatKhuyenMai(
            int id,
            [FromBody] CapNhatKhuyenMaiRequest request)
        {
            var km = await _context.Khuyenmais.FindAsync(id);

            if (km == null)
                return NotFound();

            if (!await CoQuyenQuanLyKhuyenMai(km))
            {
                return StatusCode(403, new
                {
                    message = "Bạn không có quyền quản lý mã khuyến mãi này."
                });
            }

            if (request.NgayKetThuc <= request.NgayBatDau)
            {
                return BadRequest(new
                {
                    message = "Thời gian kết thúc phải sau thời gian bắt đầu."
                });
            }

            if (request.SoLuong < 1 || request.SoLuong < km.SoLuongDaDung)
            {
                return BadRequest(new
                {
                    message = "Số lượng phải lớn hơn 0 và không nhỏ hơn số lượt đã dùng."
                });
            }

            km.MoTa = string.IsNullOrWhiteSpace(request.MoTa)
                ? null
                : request.MoTa.Trim();
            km.SoLuong = request.SoLuong;
            km.NgayBatDau = request.NgayBatDau;
            km.NgayKetThuc = request.NgayKetThuc;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật thành công"
            });
        }

        // =========================
        // THAY ĐỔI TRẠNG THÁI
        // =========================

        [HttpPut("{id}/trang-thai")]
        [Authorize(Roles = "Quan,Admin")]
        public async Task<IActionResult> ThayDoiTrangThai(int id)
        {
            var km = await _context.Khuyenmais.FindAsync(id);

            if (km == null)
                return NotFound();

            if (!await CoQuyenQuanLyKhuyenMai(km))
            {
                return StatusCode(403, new
                {
                    message = "Bạn không có quyền quản lý mã khuyến mãi này."
                });
            }

            km.TrangThai = !km.TrangThai;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thay đổi trạng thái thành công"
            });
        }

        // =========================
        // KIỂM TRA MÃ KHUYẾN MÃI
        // =========================

        [HttpPost("kiem-tra")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> KiemTraMaKhuyenMai(
            [FromBody] KiemTraKhuyenMaiRequest req)
        {
            req.MaCode = req.MaCode.Trim().ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(req.MaCode))
            {
                return BadRequest(new
                {
                    message = "Vui lòng nhập mã khuyến mãi."
                });
            }

            var km = await _context.Khuyenmais
                .FirstOrDefaultAsync(x => x.MaCode == req.MaCode);

            if (km == null || km.TrangThai == false)
                return BadRequest(
                    "Mã không hợp lệ hoặc đã bị khóa."
                );

            if (DateTime.Now < km.NgayBatDau ||
                DateTime.Now > km.NgayKetThuc)
            {
                return BadRequest(
                    "Mã đã hết hạn hoặc chưa đến thời gian sử dụng."
                );
            }

            if (km.SoLuongDaDung >= km.SoLuong)
                return BadRequest(
                    "Mã đã hết lượt sử dụng."
                );

            if (req.TongTienHang < km.DonHangToiThieu)
            {
                return BadRequest(
                    $"Đơn hàng chưa đạt mức tối thiểu {km.DonHangToiThieu}đ."
                );
            }

            if (km.MaNhaHang.HasValue &&
                km.MaNhaHang != req.MaNhaHang)
            {
                return BadRequest(
                    "Mã này không áp dụng cho nhà hàng này."
                );
            }

            decimal soTienGiam =
                km.LoaiGiam == "SoTien"
                    ? km.GiaTriGiam
                    : (req.TongTienHang * km.GiaTriGiam / 100);

            if (km.GiamToiDa.HasValue &&
                soTienGiam > km.GiamToiDa.Value)
            {
                soTienGiam = km.GiamToiDa.Value;
            }

            soTienGiam = Math.Min(
                Math.Max(soTienGiam, 0m),
                Math.Max(req.TongTienHang, 0m)
             );

            return Ok(new
            {
                maKhuyenMai = km.MaKhuyenMai,
                soTienGiam,
                message = "Mã hợp lệ"
            });
        }
    }

    // =========================
    // DTO TẠO KHUYẾN MÃI
    // =========================

    public class TaoKhuyenMaiRequest : PromotionCreateRequest
    {
    }

    // =========================
    // DTO CẬP NHẬT KHUYẾN MÃI
    // =========================

    public class CapNhatKhuyenMaiRequest : IValidatableObject
    {
        [MaxLength(200)]
        public string? MoTa { get; set; }

        [Range(1, int.MaxValue)]
        public int SoLuong { get; set; }

        public DateTime NgayBatDau { get; set; }

        public DateTime NgayKetThuc { get; set; }

        public IEnumerable<ValidationResult> Validate(
            ValidationContext validationContext)
        {
            if (NgayBatDau.Year < 1000 ||
                NgayKetThuc.Year < 1000 ||
                NgayKetThuc <= NgayBatDau)
            {
                yield return new ValidationResult(
                    "Thời gian kết thúc phải sau thời gian bắt đầu.",
                    new[] { nameof(NgayKetThuc) });
            }
        }
    }

    public class KiemTraKhuyenMaiRequest
    {
        [Required, MaxLength(30)]
        public string MaCode { get; set; } = "";

        [Range(1, int.MaxValue)]
        public int MaNhaHang { get; set; }

        [Range(typeof(decimal), "0", "999999999999999999")]
        public decimal TongTienHang { get; set; }
    }
}
