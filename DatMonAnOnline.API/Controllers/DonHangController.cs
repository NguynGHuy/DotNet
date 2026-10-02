using DatMonAnOnline.API.Models;
using DatMonAnOnline.API.Services;
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

        private static bool HienThiDonChoQuan(Donhang donHang)
        {
            var moiNhat = donHang.Thanhtoans
                .OrderByDescending(x => x.MaThanhToan)
                .FirstOrDefault();

            if (moiNhat == null)
                return true;

            if (moiNhat.MaPhuongThucNavigation?.TenPhuongThuc == "COD")
                return true;

            return moiNhat.TrangThaiThanhToan != "ChoThanhToan"
                && moiNhat.TrangThaiThanhToan != "ThatBai";
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
            if (maTaiKhoan == null) return Unauthorized(new { Message = "Vui lòng đăng nhập." });

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
            if (maTaiKhoan == null) return Unauthorized(new { Message = "Vui lòng đăng nhập." });

            var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
            if (khachHang == null) return Unauthorized();

            // 1. Kiểm tra địa chỉ
            var diaChi = await _context.Diachis.FirstOrDefaultAsync(d => d.MaDiaChi == request.MaDiaChi && d.MaKhachHang == khachHang.MaKhachHang);
            if (diaChi == null) return BadRequest(new { Message = "Địa chỉ giao hàng không hợp lệ." });

            // 2. Tính toán tiền an toàn từ DB
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
                    MaNhaHang = maNhaHang!.Value, // Thêm ! để báo compiler biết maNhaHang chắc chắn khác null
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

        [HttpPost("dat-hang-tam")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DatHangTam([FromBody] DatHangTamYeuCau request)
        {
            const int maNhaHangTest = 3;

            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Vui lòng đăng nhập." });

            var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
            if (khachHang == null) return Unauthorized();

            var diaChi = await _context.Diachis.FirstOrDefaultAsync(d =>
                d.MaDiaChi == request.MaDiaChi && d.MaKhachHang == khachHang.MaKhachHang);
            if (diaChi == null) return BadRequest(new { message = "Địa chỉ giao hàng không hợp lệ." });

            var nhaHang = await _context.Nhahangs.AsNoTracking()
                .FirstOrDefaultAsync(n => n.MaNhaHang == maNhaHangTest);
            if (nhaHang == null || nhaHang.TrangThaiHoatDong != "MoCua")
                return BadRequest(new { message = "Nhà hàng hiện đang tạm ngưng nhận đơn." });

            var monAn = await _context.Monans.AsNoTracking()
                .Where(m => m.MaNhaHang == maNhaHangTest && m.TrangThai == true)
                .OrderBy(m => m.MaMonAn)
                .FirstOrDefaultAsync();
            if (monAn == null)
                return BadRequest(new { message = "Nhà hàng test không còn món đang bán." });

            var phuongThuc = await _context.Phuongthucthanhtoans.AsNoTracking()
                .FirstOrDefaultAsync(p => p.MaPhuongThuc == request.MaPhuongThuc && p.TrangThai == true);
            if (phuongThuc == null)
                return BadRequest(new { message = "Phương thức thanh toán không hợp lệ hoặc đã tắt." });

            var tongTienHang = monAn.Gia;
            var phiShip = nhaHang.PhiShipMacDinh;
            var (soTienGiam, loiGiam) = await TinhGiamChoDonTam(request.MaKhuyenMai, tongTienHang, maNhaHangTest);
            if (loiGiam != null) return BadRequest(new { message = loiGiam });

            var thanhTien = tongTienHang + phiShip - soTienGiam;
            if (thanhTien < 0) thanhTien = 0;

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var donHang = new Donhang
                {
                    MaDonHangHienThi = $"DH{DateTime.Now:yyMMdd}-{new Random().Next(1000, 9999)}",
                    MaKhachHang = khachHang.MaKhachHang,
                    MaNhaHang = maNhaHangTest,
                    MaDiaChi = diaChi.MaDiaChi,
                    MaTrangThai = 1,
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

                _context.Chitietdonhangs.Add(new Chitietdonhang
                {
                    MaDonHang = donHang.MaDonHang,
                    MaMonAn = monAn.MaMonAn,
                    SoLuong = 1,
                    DonGia = monAn.Gia,
                    ThanhTien = monAn.Gia
                });

                _context.Lichsutrangthaidonhangs.Add(new Lichsutrangthaidonhang
                {
                    MaDonHang = donHang.MaDonHang,
                    MaTrangThai = 1,
                    MaTaiKhoan = maTaiKhoan.Value,
                    ThoiGianTao = DateTime.Now,
                    GhiChu = "Khách hàng đặt đơn tạm"
                });

                var thanhToan = new Thanhtoan
                {
                    MaDonHang = donHang.MaDonHang,
                    MaPhuongThuc = phuongThuc.MaPhuongThuc,
                    SoTien = thanhTien,
                    TrangThaiThanhToan = "ChoThanhToan"
                };
                _context.Thanhtoans.Add(thanhToan);

                if (request.MaKhuyenMai.HasValue)
                {
                    var km = await _context.Khuyenmais.FindAsync(request.MaKhuyenMai);
                    if (km != null) km.SoLuongDaDung += 1;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Đặt hàng tạm thành công.",
                    maDonHang = donHang.MaDonHang,
                    maDonHangHienThi = donHang.MaDonHangHienThi,
                    maThanhToan = thanhToan.MaThanhToan,
                    tenMonAn = monAn.TenMonAn,
                    thanhTien,
                    tenPhuongThuc = phuongThuc.TenPhuongThuc
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đặt hàng tạm: " + ex.Message });
            }
        }

        [HttpGet("cua-toi")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DonHangCuaToi()
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
            if (khachHang == null) return Unauthorized();
            
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
                    TenNhaHang = d.MaNhaHangNavigation!.TenNhaHang, // Thêm !
                    TrangThai = d.MaTrangThaiNavigation!.TenTrangThai, // Thêm !
                    ThanhTien = d.ThanhTien
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        [HttpGet("{id}")]
        [Authorize] // Cả Khách và Quán đều xem được
        public async Task<IActionResult> ChiTietDonHang(int id)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var role = User.FindFirstValue(ClaimTypes.Role);

            var donHang = await _context.Donhangs
                .Include(d => d.MaTrangThaiNavigation)
                .Include(d => d.MaNhaHangNavigation)
                .Include(d => d.Chitietdonhangs).ThenInclude(ct => ct.MaMonAnNavigation)
                .Include(d => d.Chitietdonhangs).ThenInclude(ct => ct.ChitietdonhangToppings).ThenInclude(tp => tp.MaToppingNavigation)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (donHang == null) return NotFound(new { Message = "Không tìm thấy đơn hàng." });

            // KIỂM TRA QUYỀN SỞ HỮU
            if (role == "KhachHang")
            {
                var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
                if (khachHang == null || donHang.MaKhachHang != khachHang.MaKhachHang)
                    return StatusCode(403, new { Message = "Bạn không có quyền xem đơn hàng này." });
            }
            else if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs.FirstOrDefaultAsync(n => n.MaTaiKhoan == maTaiKhoan);
                if (nhaHang == null || donHang.MaNhaHang != nhaHang.MaNhaHang)
                    return StatusCode(403, new { Message = "Đơn hàng này không thuộc quán của bạn." });
            }

            return Ok(new
            {
                donHang.MaDonHang,
                donHang.MaNhaHang,
                donHang.MaDonHangHienThi,
                donHang.TenNguoiNhan,
                donHang.SoDienThoaiNhan,
                donHang.DiaChiGiaoHang,
                donHang.GhiChu,
                donHang.ThoiGianDat,
                TrangThai = donHang.MaTrangThaiNavigation?.TenTrangThai ?? "",
                TenNhaHang = donHang.MaNhaHangNavigation?.TenNhaHang ?? "",
                donHang.TongTienHang,
                donHang.PhiShip,
                donHang.SoTienGiam,
                donHang.ThanhTien,
                ChiTiet = donHang.Chitietdonhangs.Select(ct => new
                {
                    ct.MaMonAn,
                    TenMonAn = ct.MaMonAnNavigation?.TenMonAn ?? "",
                    SoLuong = ct.SoLuong,
                    DonGia = ct.DonGia,
                    ThanhTien = ct.ThanhTien,
                    Toppings = ct.ChitietdonhangToppings.Select(tp => new
                    {
                        TenTopping = tp.MaToppingNavigation?.TenTopping ?? "",
                        GiaThem = tp.GiaThemLucDat,
                        SoLuong = tp.SoLuong
                    })
                })
            });
        }

        [HttpGet("~/api/nha-hang/don-hang")] 
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> DanhSachDonHangCuaQuan([FromQuery] int? maTrangThai)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var nhaHang = await _context.Nhahangs.FirstOrDefaultAsync(n => n.MaTaiKhoan == maTaiKhoan);
            if (nhaHang == null) return Unauthorized();
            
            var query = _context.Donhangs.Where(d => d.MaNhaHang == nhaHang.MaNhaHang);
            if (maTrangThai.HasValue) query = query.Where(d => d.MaTrangThai == maTrangThai);

            var donHangQuan = await query
                .Include(d => d.MaTrangThaiNavigation)
                .Include(d => d.Thanhtoans)
                    .ThenInclude(t => t.MaPhuongThucNavigation)
                .OrderByDescending(d => d.ThoiGianDat)
                .ToListAsync();

            var danhSach = donHangQuan
                .Where(HienThiDonChoQuan)
                .Select(d => new
                {
                    d.MaDonHang,
                    d.MaDonHangHienThi,
                    d.ThoiGianDat,
                    d.TenNguoiNhan,
                    TrangThai = d.MaTrangThaiNavigation!.TenTrangThai,
                    ThanhTien = d.ThanhTien
                })
                .ToList();

            return Ok(danhSach);
        }

        [HttpPut("{id}/huy")]
        [Authorize]
        public async Task<IActionResult> HuyDonHang(int id, [FromBody] HuyDonHangYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var role = User.FindFirstValue(ClaimTypes.Role);

            var donHang = await _context.Donhangs.FindAsync(id);
            if (donHang == null) return NotFound(new { Message = "Đơn hàng không tồn tại." });

            // KIỂM TRA QUYỀN SỞ HỮU
            if (role == "KhachHang")
            {
                var khachHang = await _context.Khachhangs.FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);
                if (khachHang == null || donHang.MaKhachHang != khachHang.MaKhachHang)
                    return StatusCode(403, new { Message = "Bạn không có quyền huỷ đơn hàng này." });
            }
            else if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs.FirstOrDefaultAsync(n => n.MaTaiKhoan == maTaiKhoan);
                if (nhaHang == null || donHang.MaNhaHang != nhaHang.MaNhaHang)
                    return StatusCode(403, new { Message = "Đơn hàng này không thuộc quán của bạn." });
            }

            // Chỉ cho huỷ nếu đang chờ xác nhận (1) hoặc đã xác nhận (2)
            if (donHang.MaTrangThai > 2)
            {
                return BadRequest(new { Message = "Không thể huỷ đơn hàng ở trạng thái hiện tại." });
            }

            donHang.MaTrangThai = 6; // DaHuy
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
        [HttpGet("~/api/trang-thai-don-hang")]
        [Authorize]
        public async Task<IActionResult> GetDanhSachTrangThaiDonHang()
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });
            var result = await _context.Trangthaidonhangs
                .AsNoTracking()
                .OrderBy(x => x.ThuTu)
                .Select(x => new
                {
                    x.MaTrangThai,
                    x.TenTrangThai,
                    x.ThuTu
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id:int}/lich-su-trang-thai")]
        [Authorize]
        public async Task<IActionResult> GetLichSuTrangThaiDonHang(int id)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });
            var donHang = await _context.Donhangs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MaDonHang == id);
            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng." });
            var role = User.FindFirstValue(ClaimTypes.Role);
            var duocXem = await KiemTraQuyenXemDonHang(role, maTaiKhoan.Value, donHang);
            if (duocXem == false)
                return StatusCode(403, new { message = "Bạn không có quyền xem đơn hàng này." });
            if (duocXem == null)
                return Unauthorized(new { message = "Token không hợp lệ." });
            var result = await _context.Lichsutrangthaidonhangs
                .AsNoTracking()
                .Where(x => x.MaDonHang == id)
                .OrderBy(x => x.ThoiGianTao)
                .ThenBy(x => x.MaLichSu)
                .Select(x => new
                {
                    x.MaLichSu,
                    x.MaDonHang,
                    x.MaTrangThai,
                    tenTrangThai = x.MaTrangThaiNavigation.TenTrangThai,
                    x.MaTaiKhoan,
                    x.ThoiGianTao,
                    x.GhiChu
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpPut("{id:int}/trang-thai")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> CapNhatTrangThaiDonHang(int id, CapNhatTrangThaiYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized(new { message = "Token không hợp lệ." });
            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan.Value);
            if (nhaHang == null)
                return NotFound(new { message = "Không tìm thấy nhà hàng của tài khoản này." });
            var donHang = await _context.Donhangs
                .Include(x => x.Thanhtoans)
                    .ThenInclude(x => x.MaPhuongThucNavigation)
                .FirstOrDefaultAsync(x => x.MaDonHang == id);
            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng." });
            if (donHang.MaNhaHang != nhaHang.MaNhaHang)
                return StatusCode(403, new { message = "Đơn hàng này không thuộc quán của bạn." });
            if (donHang.MaTrangThai == 5)
                return BadRequest(new { message = "Đơn hàng đã hoàn thành, không thể cập nhật trạng thái." });
            if (donHang.MaTrangThai == 6)
                return BadRequest(new { message = "Đơn hàng đã huỷ, không thể cập nhật trạng thái." });
            // khong cho nhay qua trang thai, chi duoc nhay sang trang thai tiep theo
            if (request.MaTrangThai != donHang.MaTrangThai + 1 || request.MaTrangThai > 5)
                return BadRequest(new { message = "Chỉ được chuyển sang trạng thái kế tiếp theo thứ tự." });
            var trangThaiMoi = await _context.Trangthaidonhangs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MaTrangThai == request.MaTrangThai);
            if (trangThaiMoi == null)
                return BadRequest(new { message = "Mã trạng thái không hợp lệ." });
            donHang.MaTrangThai = request.MaTrangThai;
            if (request.MaTrangThai == 5)  // cap nhat thoi gian giao thuc te va thanh toan khi nhan hang 
            {
                donHang.ThoiGianGiaoThucTe = DateTime.Now;
                var thanhToanCod = donHang.Thanhtoans
                    .Where(x => x.TrangThaiThanhToan == "ChoThanhToan"
                                && x.MaPhuongThucNavigation.TenPhuongThuc == "COD")
                    .OrderByDescending(x => x.MaThanhToan)
                    .FirstOrDefault();
                if (thanhToanCod != null)
                {
                    thanhToanCod.TrangThaiThanhToan = "ThanhCong";
                    thanhToanCod.ThoiGianThanhToan = DateTime.Now;
                }
            }
            _context.Lichsutrangthaidonhangs.Add(new Lichsutrangthaidonhang
            {
                MaDonHang = donHang.MaDonHang,
                MaTrangThai = request.MaTrangThai,
                MaTaiKhoan = maTaiKhoan.Value,
                ThoiGianTao = DateTime.Now,
                GhiChu = string.IsNullOrWhiteSpace(request.GhiChu)
                    ? $"Quán cập nhật trạng thái: {trangThaiMoi.TenTrangThai}"
                    : request.GhiChu.Trim()
            });
            await _context.SaveChangesAsync();
            return Ok(new
            {
                message = "Cập nhật trạng thái đơn hàng thành công.",
                maDonHang = donHang.MaDonHang,
                maTrangThai = donHang.MaTrangThai,
                tenTrangThai = trangThaiMoi.TenTrangThai
            });
        }

        private async Task<bool?> KiemTraQuyenXemDonHang(string? role, int maTaiKhoan, Donhang donHang)
        {
            if (role == "KhachHang")
            {
                var khachHang = await _context.Khachhangs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan);
                if (khachHang == null) return null;
                return donHang.MaKhachHang == khachHang.MaKhachHang;
            }
            if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.MaTaiKhoan == maTaiKhoan);
                if (nhaHang == null) return null;
                return donHang.MaNhaHang == nhaHang.MaNhaHang;
            }
            if (role == "Admin")
            {
                return true;
            }
            return false;
        }

        // ---- HÀM HỖ TRỢ TÍNH TIỀN ----
        private async Task<(decimal TongTien, decimal PhiShip, decimal Giam, int? MaNhaHang, string? Loi)> TinhTienDonHang(int maKhachHang, int? maKhuyenMai)
        {
            var gioHang = await _context.Giohangs
                .Include(g => g.Chitietgiohangs).ThenInclude(ct => ct.MaMonAnNavigation)
                    .ThenInclude(m => m.MaNhomToppings).ThenInclude(nhom => nhom.Toppings)
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
                if (ct.ChitietgiohangToppings.Any(tp => tp.SoLuong != 1))
                    return (0, 0, 0, null, "Số lượng topping trong giỏ không hợp lệ. Vui lòng xóa món và chọn lại.");

                var loiTopping = ToppingValidator.KiemTra(ct.MaMonAnNavigation,
                    ct.ChitietgiohangToppings.Select(tp => tp.MaTopping).ToArray());
                if (loiTopping != null)
                    return (0, 0, 0, null, $"Món {ct.MaMonAnNavigation.TenMonAn}: {loiTopping} Vui lòng xóa món khỏi giỏ và chọn lại.");

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

        private async Task<(decimal SoTienGiam, string? Loi)> TinhGiamChoDonTam(int? maKhuyenMai, decimal tongTienHang, int maNhaHang)
        {
            if (!maKhuyenMai.HasValue) return (0, null);

            var km = await _context.Khuyenmais.AsNoTracking().FirstOrDefaultAsync(k => k.MaKhuyenMai == maKhuyenMai);
            if (km == null || km.TrangThai == false)
                return (0, "Mã khuyến mãi không hợp lệ.");
            if (DateTime.Now < km.NgayBatDau || DateTime.Now > km.NgayKetThuc)
                return (0, "Mã khuyến mãi hết hạn hoặc chưa đến giờ.");
            if (km.SoLuongDaDung >= km.SoLuong)
                return (0, "Mã khuyến mãi đã hết lượt.");
            if (tongTienHang < km.DonHangToiThieu)
                return (0, $"Đơn hàng chưa đạt tối thiểu {km.DonHangToiThieu} để áp dụng mã.");
            if (km.MaNhaHang.HasValue && km.MaNhaHang != maNhaHang)
                return (0, "Mã khuyến mãi không áp dụng cho quán này.");

            var soTienGiam = km.LoaiGiam == "SoTien" ? km.GiaTriGiam : (tongTienHang * km.GiaTriGiam / 100);
            if (km.GiamToiDa.HasValue && soTienGiam > km.GiamToiDa.Value)
                soTienGiam = km.GiamToiDa.Value;
            return (soTienGiam, null);
        }
    }

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

    public class DatHangTamYeuCau
    {
        [Required] public int MaDiaChi { get; set; }
        [Required] public int MaPhuongThuc { get; set; }
        public int? MaKhuyenMai { get; set; }
        public string? GhiChu { get; set; }
    }

    public class HuyDonHangYeuCau
    {
        [Required] public string LyDoHuy { get; set; } = string.Empty;
    }

    public class CapNhatTrangThaiYeuCau
    {
        [Required] public int MaTrangThai { get; set; }
        [MaxLength(200)] public string? GhiChu { get; set; }
    }
}
