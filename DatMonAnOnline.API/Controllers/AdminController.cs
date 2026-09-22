using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;

namespace DatMonAnOnline.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public AdminController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        [HttpPost("khuyen-mai")]
        public async Task<IActionResult> TaoKhuyenMaiHeThong([FromBody] TaoKhuyenMaiAdminRequest req)
        {
            var khuyenMai = new Khuyenmai
            {
                MaCode = req.MaCode,
                MoTa = req.MoTa,
                LoaiGiam = req.LoaiGiam,
                GiaTriGiam = req.GiaTriGiam,
                GiamToiDa = req.GiamToiDa,
                DonHangToiThieu = req.DonHangToiThieu,
                SoLuong = req.SoLuong,
                NgayBatDau = req.NgayBatDau,
                NgayKetThuc = req.NgayKetThuc,
                MaNhaHang = null, // Khuyến mãi toàn hệ thống
                TrangThai = true,
                SoLuongDaDung = 0
            };

            _context.Khuyenmais.Add(khuyenMai);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tạo mã khuyến mãi hệ thống thành công" });
        }

        [HttpGet("nha-hang/cho-duyet")]
        public async Task<IActionResult> DanhSachNhaHangChoDuyet()
        {
            var list = await _context.Nhahangs
                .Where(x => x.TrangThaiDuyet == "ChoDuyet")
                .ToListAsync();
            return Ok(list);
        }

        [HttpPut("nha-hang/{id}/duyet")]
        public async Task<IActionResult> DuyetNhaHang(int id)
        {
            var quan = await _context.Nhahangs.FindAsync(id);
            if (quan == null) return NotFound();

            quan.TrangThaiDuyet = "DaDuyet";
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã duyệt nhà hàng" });
        }

        [HttpPut("nha-hang/{id}/tu-choi")]
        public async Task<IActionResult> TuChoiNhaHang(int id)
        {
            var quan = await _context.Nhahangs.FindAsync(id);
            if (quan == null) return NotFound();

            quan.TrangThaiDuyet = "TuChoi";
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã từ chối nhà hàng" });
        }

        [HttpGet("thong-ke/tong-quan")]
        public async Task<IActionResult> ThongKeTongQuan()
        {
            var tongQuan = await _context.Nhahangs.CountAsync(x => x.TrangThaiDuyet == "DaDuyet");
            var tongDon = await _context.Donhangs.CountAsync();
            var tongDoanhThu = await _context.Donhangs
                .Where(x => x.MaTrangThai == 5) // 5 = HoanThanh
                .SumAsync(x => x.ThanhTien);

            return Ok(new { tongNhaHang = tongQuan, tongDonHang = tongDon, tongDoanhThu });
        }

        [HttpGet("thong-ke/top-nha-hang")]
        public async Task<IActionResult> ThongKeTopNhaHang()
        {
            var top = await _context.Nhahangs
                .Where(x => x.TrangThaiDuyet == "DaDuyet")
                .OrderByDescending(x => x.DanhGiaTrungBinh)
                .Take(10)
                .ToListAsync();
            return Ok(top);
        }

        [HttpGet("don-hang")]
        public async Task<IActionResult> XemToanBoDonHang([FromQuery] int? maNhaHang, [FromQuery] int? trangThai, [FromQuery] DateTime? ngay)
        {
            var query = _context.Donhangs.AsQueryable();

            if (maNhaHang.HasValue) query = query.Where(x => x.MaNhaHang == maNhaHang);
            if (trangThai.HasValue) query = query.Where(x => x.MaTrangThai == trangThai);
            if (ngay.HasValue) query = query.Where(x => x.ThoiGianDat.Date == ngay.Value.Date);

            var list = await query.OrderByDescending(x => x.ThoiGianDat).ToListAsync();
            return Ok(list);
        }
        public class TaoKhuyenMaiAdminRequest
        {
            public string MaCode { get; set; } = null!;
            public string? MoTa { get; set; }
            public string LoaiGiam { get; set; } = null!;
            public decimal GiaTriGiam { get; set; }
            public decimal? GiamToiDa { get; set; }
            public decimal DonHangToiThieu { get; set; }
            public int SoLuong { get; set; }
            public DateTime NgayBatDau { get; set; }
            public DateTime NgayKetThuc { get; set; }
        }
    }
}