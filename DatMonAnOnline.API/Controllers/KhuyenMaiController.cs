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

        private int GetCurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        [HttpPost]
        [Authorize(Roles = "Quan,Admin")]
        public async Task<IActionResult> TaoKhuyenMai([FromBody] Khuyenmai khuyenMai)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs.FirstOrDefaultAsync(n => n.MaTaiKhoan == GetCurrentUserId());
                if (nhaHang == null) return BadRequest("Không tìm thấy thông tin nhà hàng.");
                khuyenMai.MaNhaHang = nhaHang.MaNhaHang;
            }
            else if (role == "Admin")
            {
                khuyenMai.MaNhaHang = null; // Khuyến mãi toàn sàn
            }

            khuyenMai.TrangThai = true;
            khuyenMai.SoLuongDaDung = 0;

            _context.Khuyenmais.Add(khuyenMai);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tạo mã khuyến mãi thành công", data = khuyenMai });
        }

        [HttpGet("cua-toi")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> LayDanhSachKhuyenMaiCuaQuan()
        {
            var nhaHang = await _context.Nhahangs.FirstOrDefaultAsync(n => n.MaTaiKhoan == GetCurrentUserId());
            if (nhaHang == null) return BadRequest();

            var list = await _context.Khuyenmais
                .Where(x => x.MaNhaHang == nhaHang.MaNhaHang)
                .ToListAsync();
            return Ok(list);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Quan,Admin")]
        public async Task<IActionResult> CapNhatKhuyenMai(int id, [FromBody] Khuyenmai model)
        {
            var km = await _context.Khuyenmais.FindAsync(id);
            if (km == null) return NotFound();

            km.MoTa = model.MoTa;
            km.SoLuong = model.SoLuong;
            km.NgayBatDau = model.NgayBatDau;
            km.NgayKetThuc = model.NgayKetThuc;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        [HttpPut("{id}/trang-thai")]
        [Authorize(Roles = "Quan,Admin")]
        public async Task<IActionResult> ThayDoiTrangThai(int id)
        {
            var km = await _context.Khuyenmais.FindAsync(id);
            if (km == null) return NotFound();

            km.TrangThai = !km.TrangThai;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thay đổi trạng thái thành công" });
        }

        [HttpPost("kiem-tra")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> KiemTraMaKhuyenMai([FromBody] KiemTraKhuyenMaiRequest req)
        {
            var km = await _context.Khuyenmais.FirstOrDefaultAsync(x => x.MaCode == req.MaCode);
            if (km == null || km.TrangThai == false) return BadRequest("Mã không hợp lệ hoặc đã bị khóa.");

            if (DateTime.Now < km.NgayBatDau || DateTime.Now > km.NgayKetThuc) return BadRequest("Mã đã hết hạn hoặc chưa đến thời gian sử dụng.");
            if (km.SoLuongDaDung >= km.SoLuong) return BadRequest("Mã đã hết lượt sử dụng.");
            if (req.TongTienHang < km.DonHangToiThieu) return BadRequest($"Đơn hàng chưa đạt mức tối thiểu {km.DonHangToiThieu}đ.");

            if (km.MaNhaHang.HasValue && km.MaNhaHang != req.MaNhaHang)
                return BadRequest("Mã này không áp dụng cho nhà hàng này.");

            decimal soTienGiam = km.LoaiGiam == "SoTien" ? km.GiaTriGiam : (req.TongTienHang * km.GiaTriGiam / 100);
            if (km.GiamToiDa.HasValue && soTienGiam > km.GiamToiDa.Value)
            {
                soTienGiam = km.GiamToiDa.Value;
            }

            return Ok(new { soTienGiam, message = "Mã hợp lệ" });
        }
    }

    public class KiemTraKhuyenMaiRequest
    {
        public string MaCode { get; set; } = null!;
        public int MaNhaHang { get; set; }
        public decimal TongTienHang { get; set; }
    }
}