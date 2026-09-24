using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;
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

        // =========================
        // TẠO KHUYẾN MÃI
        // =========================

        [HttpPost]
        [Authorize(Roles = "Quan,Admin")]
        public async Task<IActionResult> TaoKhuyenMai(
            [FromBody] TaoKhuyenMaiRequest request)
        {
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

            await _context.SaveChangesAsync();

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
        public async Task<IActionResult> LayDanhSachKhuyenMaiCuaQuan()
        {
            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(
                    n => n.MaTaiKhoan == GetCurrentUserId()
                );

            if (nhaHang == null)
                return BadRequest("Không tìm thấy thông tin nhà hàng.");

            var list = await _context.Khuyenmais
                .Where(x => x.MaNhaHang == nhaHang.MaNhaHang)
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
                .ToListAsync();

            return Ok(list);
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

            km.MoTa = request.MoTa;
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

            return Ok(new
            {
                soTienGiam,
                message = "Mã hợp lệ"
            });
        }
    }

    // =========================
    // DTO TẠO KHUYẾN MÃI
    // =========================

    public class TaoKhuyenMaiRequest
    {
        public string MaCode { get; set; } = null!;

        public string? MoTa { get; set; }

        public int SoLuong { get; set; }

        public DateTime NgayBatDau { get; set; }

        public DateTime NgayKetThuc { get; set; }

        public decimal DonHangToiThieu { get; set; }

        public string LoaiGiam { get; set; } = null!;

        public decimal GiaTriGiam { get; set; }

        public decimal? GiamToiDa { get; set; }
    }

    // =========================
    // DTO CẬP NHẬT KHUYẾN MÃI
    // =========================

    public class CapNhatKhuyenMaiRequest
    {
        public string? MoTa { get; set; }

        public int SoLuong { get; set; }

        public DateTime NgayBatDau { get; set; }

        public DateTime NgayKetThuc { get; set; }
    }

    // =========================
    // DTO KIỂM TRA KHUYẾN MÃI
    // =========================

    public class KiemTraKhuyenMaiRequest
    {
        public string MaCode { get; set; } = null!;

        public int MaNhaHang { get; set; }

        public decimal TongTienHang { get; set; }
    }
}