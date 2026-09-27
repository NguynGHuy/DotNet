using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/don-hang")]
    [ApiController]
    public class DonHangController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public DonHangController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        private async Task<int?> LayMaTaiKhoan()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdStr, out var maTaiKhoan) ? maTaiKhoan : null;
        }

        [HttpPost("kiem-tra-truoc-checkout")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> KiemTraCheckout([FromBody] KiemTraDonHangYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
            if (khachHang == null) return Unauthorized();

            var (tongTienHang, phiShip, soTienGiam, maNhaHang, loi) = await TinhTienDonHang(khachHang.MaKhachHang, request.MaKhuyenMai);
            
            if (loi != null) return BadRequest(new { Message = loi });

            return Ok(new
            {
                TongTienHang = tongTienHang,
                PhiShip = phiShip,
                SoTienGiam = soTienGiam,
                ThanhTien = tongTienHang + phiShip - soTienGiam
            });
        }

        [HttpPost("dat-hang")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DatHang([FromBody] DatHangYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
            if (khachHang == null) return Unauthorized();

            // 1. Kiểm tra địa chỉ
            var diaChi = await _context.Diachis.FirstOrDefaultAsync(d => d.MaDiaChi == request.MaDiaChi && d.MaKhachHang == khachHang.MaKhachHang);
            if (diaChi == null) return BadRequest(new { Message = "Địa chỉ giao hàng không hợp lệ." });

            // 2. Tính toán tiền an toàn từ DB (Không tin tưởng frontend)
            var (tongTienHang, phiShip, soTienGiam, maNhaHang, loi) = await TinhTienDonHang(khachHang.MaKhachHang, request.MaKhuyenMai);
            if (loi != null) return BadRequest(new { Message = loi });

            var thanhTien = tongTienHang + phiShip - soTienGiam;

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 3. Tạo Đơn hàng
                var maDonHienThi = $"DH{DateTime.Now:yyMMdd}-{new Random().Next(1000, 9999)}";
                
                var donHang = new Donhang
                {
                    MaDonHangHienThi = maDonHienThi,
                    MaKhachHang = khachHang.MaKhachHang,
                    MaNhaHang = maNhaHang.Value,
                    MaDiaChi = diaChi.MaDiaChi,
                    MaTrangThai = 1, // 1 = ChoXacNhan
                    MaKhuyenMai = request.MaKhuyenMai,
                    ThoiGianDat = DateTime.Now,
                    TenNguoiNhan = diaChi.TenNguoiNhan,
                    SoDienThoaiNhan = diaChi.SoDienThoaiNhan,
                    DiaChiGiaoHang = diaChi.DiaChiCuThe,
                    TongTienHang = tongTienHang,
                    PhiShip = phiShip,
                    SoTienGiam = soTienGiam,
                    ThanhTien = thanhTien,
                    GhiChu = request.GhiChu
                };
                _context.Donhangs.Add(donHang);
                await _context.SaveChangesAsync();

                // 4. Snapshot Chi Tiết Đơn Hàng từ Giỏ Hàng
                var gioHang = await _context.Giohangs
                    .Include(g => g.Chitietgiohangs).ThenInclude(ct => ct.MaMonAnNavigation)
                    .Include(g => g.Chitietgiohangs).ThenInclude(ct => ct.ChitietgiohangToppings)
                    .FirstAsync(g => g.MaKhachHang == khachHang.MaKhachHang);

                foreach (var ctGio in gioHang.Chitietgiohangs)
                {
                    var ctDon = new Chitietdonhang
                    {
                        MaDonHang = donHang.MaDonHang,
                        MaMonAn = ctGio.MaMonAn,
                        SoLuong = ctGio.SoLuong,
                        DonGia = ctGio.MaMonAnNavigation.Gia,
                        ThanhTien = ctGio.MaMonAnNavigation.Gia * ctGio.SoLuong,
                        GhiChu = ctGio.GhiChu
                    };
                    _context.Chitietdonhangs.Add(ctDon);
                    await _context.SaveChangesAsync();

                    foreach (var ctTopping in ctGio.ChitietgiohangToppings)
                    {
                        var ctDonTopping = new ChitietdonhangTopping
                        {
                            MaChiTietDonHang = ctDon.MaChiTietDonHang,
                            MaTopping = ctTopping.MaTopping,
                            SoLuong = ctTopping.SoLuong,
                            GiaThemLucDat = ctTopping.GiaThem
                        };
                        _context.ChitietdonhangToppings.Add(ctDonTopping);
                        ctDon.ThanhTien += (ctTopping.GiaThem * ctTopping.SoLuong) * ctGio.SoLuong;
                    }
                }
                
                // Đồng bộ lại tổng tiền 1 dòng của chi tiết (Món + Topping)
                await _context.SaveChangesAsync();

                // 5. Trừ lượt mã khuyến mãi nếu có
                if (request.MaKhuyenMai.HasValue)
                {
                    var km = await _context.Khuyenmais.FindAsync(request.MaKhuyenMai);
                    if(km != null) km.SoLuongDaDung += 1;
                }

                // 6. Ghi Lịch sử trạng thái đơn hàng
                _context.Lichsutrangthaidonhangs.Add(new Lichsutrangthaidonhang
                {
                    MaDonHang = donHang.MaDonHang,
                    MaTrangThai = 1,
                    MaTaiKhoan = maTaiKhoan.Value,
                    ThoiGianTao = DateTime.Now,
                    GhiChu = "Khách hàng đặt đơn mới"
                });

                // 7. Xoá Giỏ Hàng
                foreach (var ct in gioHang.Chitietgiohangs)
                {
                    _context.ChitietgiohangToppings.RemoveRange(ct.ChitietgiohangToppings);
                }
                _context.Chitietgiohangs.RemoveRange(gioHang.Chitietgiohangs);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = "Đặt hàng thành công", MaDonHang = donHang.MaDonHang, MaDonHangHienThi = donHang.MaDonHangHienThi });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Có lỗi xảy ra khi đặt hàng: " + ex.Message);
            }
        }

        [HttpGet("cua-toi")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DonHangCuaToi()
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
            
            var danhSach = await _context.Donhangs
                .Where(d => d.MaKhachHang == khachHang.MaKhachHang)
                .Include(d => d.MaNhaHangNavigation)
                .Include(d => d.MaTrangThaiNavigation)
                .OrderByDescending(d => d.ThoiGianDat)
                .Select(d => new
                {
                    d.MaDonHang,
                    d.MaDonHangHienThi,
                    d.ThoiGianDat,
                    TenNhaHang = d.MaNhaHangNavigation.TenNhaHang,
                    TrangThai = d.MaTrangThaiNavigation.TenTrangThai,
                    ThanhTien = d.ThanhTien
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        [HttpGet("{id}")]
        [Authorize] // Cả Khách và Quán đều xem được
        public async Task<IActionResult> ChiTietDonHang(int id)
        {
            var donHang = await _context.Donhangs
                .Include(d => d.MaTrangThaiNavigation)
                .Include(d => d.MaNhaHangNavigation)
                .Include(d => d.Chitietdonhangs).ThenInclude(ct => ct.MaMonAnNavigation)
                .Include(d => d.Chitietdonhangs).ThenInclude(ct => ct.ChitietdonhangToppings).ThenInclude(tp => tp.MaToppingNavigation)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (donHang == null) return NotFound("Không tìm thấy đơn hàng.");

            return Ok(new
            {
                donHang.MaDonHang,
                donHang.MaDonHangHienThi,
                donHang.TenNguoiNhan,
                donHang.SoDienThoaiNhan,
                donHang.DiaChiGiaoHang,
                donHang.GhiChu,
                donHang.ThoiGianDat,
                TrangThai = donHang.MaTrangThaiNavigation.TenTrangThai,
                TenNhaHang = donHang.MaNhaHangNavigation.TenNhaHang,
                donHang.TongTienHang,
                donHang.PhiShip,
                donHang.SoTienGiam,
                donHang.ThanhTien,
                ChiTiet = donHang.Chitietdonhangs.Select(ct => new
                {
                    TenMonAn = ct.MaMonAnNavigation.TenMonAn,
                    SoLuong = ct.SoLuong,
                    DonGia = ct.DonGia,
                    ThanhTien = ct.ThanhTien,
                    Toppings = ct.ChitietdonhangToppings.Select(tp => new
                    {
                        TenTopping = tp.MaToppingNavigation.TenTopping,
                        GiaThem = tp.GiaThemLucDat,
                        SoLuong = tp.SoLuong
                    })
                })
            });
        }

        [HttpGet("~/api/nha-hang/don-hang")] // Route đặc biệt cho Người 3 map với check-list
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> DanhSachDonHangCuaQuan([FromQuery] int? maTrangThai)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            var nhaHang = await _context.Nhahangs.FirstOrDefaultAsync(n => n.MaTaiKhoan == maTaiKhoan);
            
            var query = _context.Donhangs.Where(d => d.MaNhaHang == nhaHang.MaNhaHang);
            if (maTrangThai.HasValue) query = query.Where(d => d.MaTrangThai == maTrangThai);

            var danhSach = await query
                .Include(d => d.MaTrangThaiNavigation)
                .OrderByDescending(d => d.ThoiGianDat)
                .Select(d => new
                {
                    d.MaDonHang,
                    d.MaDonHangHienThi,
                    d.ThoiGianDat,
                    d.TenNguoiNhan,
                    TrangThai = d.MaTrangThaiNavigation.TenTrangThai,
                    ThanhTien = d.ThanhTien
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        [HttpPut("{id}/huy")]
        [Authorize]
        public async Task<IActionResult> HuyDonHang(int id, [FromBody] HuyDonHangYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            var donHang = await _context.Donhangs.FindAsync(id);
            if (donHang == null) return NotFound("Đơn hàng không tồn tại.");

            // Chỉ cho huỷ nếu đang chờ xác nhận (1) hoặc đã xác nhận (2). Đang giao/Chuẩn bị thì không cho huỷ
            if (donHang.MaTrangThai > 2)
            {
                return BadRequest("Không thể huỷ đơn hàng ở trạng thái hiện tại.");
            }

            donHang.MaTrangThai = 6; // 6 = DaHuy
            donHang.LyDoHuy = request.LyDoHuy;

            _context.Lichsutrangthaidonhangs.Add(new Lichsutrangthaidonhang
            {
                MaDonHang = donHang.MaDonHang,
                MaTrangThai = 6,
                MaTaiKhoan = maTaiKhoan.Value,
                ThoiGianTao = DateTime.Now,
                GhiChu = $"Huỷ đơn. Lý do: {request.LyDoHuy}"
            });

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Huỷ đơn hàng thành công." });
        }


        // ---- HÀM HỖ TRỢ TÍNH TIỀN (Sử dụng chung cho Kiểm tra và Đặt hàng) ----
        private async Task<(decimal TongTien, decimal PhiShip, decimal Giam, int? MaNhaHang, string? Loi)> TinhTienDonHang(int maKhachHang, int? maKhuyenMai)
        {
            var gioHang = await _context.Giohangs
                .Include(g => g.Chitietgiohangs).ThenInclude(ct => ct.MaMonAnNavigation)
                .Include(g => g.Chitietgiohangs).ThenInclude(ct => ct.ChitietgiohangToppings)
                .FirstOrDefaultAsync(g => g.MaKhachHang == maKhachHang);

            if (gioHang == null || !gioHang.Chitietgiohangs.Any())
                return (0, 0, 0, null, "Giỏ hàng trống.");

            var maNhaHang = gioHang.Chitietgiohangs.First().MaMonAnNavigation.MaNhaHang;
            var nhaHang = await _context.Nhahangs.FindAsync(maNhaHang);
            if (nhaHang == null || nhaHang.TrangThaiHoatDong != "MoCua")
                return (0, 0, 0, null, "Nhà hàng hiện đang tạm ngưng nhận đơn.");

            decimal tongTienHang = 0;
            foreach (var ct in gioHang.Chitietgiohangs)
            {
                if(ct.MaMonAnNavigation.TrangThai == false) return (0,0,0,null, $"Món {ct.MaMonAnNavigation.TenMonAn} đã ngưng bán.");
                decimal giaTopping = ct.ChitietgiohangToppings.Sum(tp => tp.GiaThem * tp.SoLuong);
                tongTienHang += (ct.MaMonAnNavigation.Gia + giaTopping) * ct.SoLuong;
            }

            decimal phiShip = nhaHang.PhiShipMacDinh;
            decimal soTienGiam = 0;

            if (maKhuyenMai.HasValue)
            {
                var km = await _context.Khuyenmais.FindAsync(maKhuyenMai.Value);
                if (km == null || km.TrangThai == false) 
                    return (0, 0, 0, null, "Mã khuyến mãi không hợp lệ.");
                if (DateTime.Now < km.NgayBatDau || DateTime.Now > km.NgayKetThuc) 
                    return (0, 0, 0, null, "Mã khuyến mãi hết hạn hoặc chưa đến giờ.");
                if (km.SoLuongDaDung >= km.SoLuong) 
                    return (0, 0, 0, null, "Mã khuyến mãi đã hết lượt.");
                if (tongTienHang < km.DonHangToiThieu) 
                    return (0, 0, 0, null, $"Đơn hàng chưa đạt tối thiểu {km.DonHangToiThieu} để áp dụng mã.");
                if (km.MaNhaHang.HasValue && km.MaNhaHang != maNhaHang) 
                    return (0, 0, 0, null, "Mã khuyến mãi không áp dụng cho quán này.");

                soTienGiam = km.LoaiGiam == "SoTien" ? km.GiaTriGiam : (tongTienHang * km.GiaTriGiam / 100);
                if (km.GiamToiDa.HasValue && soTienGiam > km.GiamToiDa.Value)
                    soTienGiam = km.GiamToiDa.Value;
            }

            return (tongTienHang, phiShip, soTienGiam, maNhaHang, null);
        }
    }

    // --- Các Class DTO ---
    public class KiemTraDonHangYeuCau
    {
        public int? MaKhuyenMai { get; set; }
    }

    public class DatHangYeuCau
    {
        [Required] public int MaDiaChi { get; set; }
        public int? MaKhuyenMai { get; set; }
        public string? GhiChu { get; set; }
    }

    public class HuyDonHangYeuCau
    {
        [Required] public string LyDoHuy { get; set; } = string.Empty;
    }
}