using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;
using DatMonAnOnline.API.Common;

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

        [HttpGet("khuyen-mai")]
        public async Task<IActionResult> LayKhuyenMaiHeThong(
            [FromQuery] PaginationQuery pagination,
            [FromQuery] string? search = null,
            [FromQuery] string? state = null)
        {
            var now = DateTime.Now;
            var query = _context.Khuyenmais
                .AsNoTracking()
                .Where(x => x.MaNhaHang == null);

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
                "inactive" => query.Where(x => x.TrangThai != true),
                "expired" => query.Where(x => x.TrangThai == true && x.NgayKetThuc < now),
                _ => query
            };

            var list = await query
                .OrderByDescending(x => x.MaKhuyenMai)
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

        [HttpGet("nha-hang/cho-duyet")]
        public async Task<IActionResult> DanhSachNhaHangChoDuyet(
            [FromQuery] PaginationQuery pagination,
            [FromQuery] string? search = null)
        {
            var query = _context.Nhahangs
                .AsNoTracking()
                .Where(x => x.TrangThaiDuyet == "ChoDuyet");

            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim();
                var hasRestaurantId = int.TryParse(keyword, out var restaurantId);
                query = query.Where(x =>
                    x.TenNhaHang.Contains(keyword) ||
                    x.DiaChiQuan.Contains(keyword) ||
                    (hasRestaurantId && x.MaNhaHang == restaurantId));
            }

            var list = await query
                .OrderByDescending(x => x.MaNhaHang)
                .ToPagedResultAsync(pagination);
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
        public async Task<IActionResult> XemToanBoDonHang(
            [FromQuery] PaginationQuery pagination,
            [FromQuery] int? maNhaHang,
            [FromQuery] int? trangThai,
            [FromQuery] DateTime? ngay)
        {
            var query = _context.Donhangs.AsQueryable();

            if (maNhaHang.HasValue) query = query.Where(x => x.MaNhaHang == maNhaHang);
            if (trangThai.HasValue) query = query.Where(x => x.MaTrangThai == trangThai);
            if (ngay.HasValue) query = query.Where(x => x.ThoiGianDat.Date == ngay.Value.Date);

            var list = await query
                .AsNoTracking()
                .OrderByDescending(x => x.ThoiGianDat)
                .ToPagedResultAsync(pagination);
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
