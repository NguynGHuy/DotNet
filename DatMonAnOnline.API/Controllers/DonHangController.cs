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
        private static readonly TimeSpan ThoiHanGioHang = TimeSpan.FromMinutes(5);
        private readonly DatMonAnOnlineContext _context;
        private readonly IRealtimeNotificationService _realtime;
        private readonly ILogger<DonHangController> _logger;

        public DonHangController(
            DatMonAnOnlineContext context,
            IRealtimeNotificationService realtime,
            ILogger<DonHangController> logger)
        {
            _context = context;
            _realtime = realtime;
            _logger = logger;
        }

        private static bool HienThiDonChoQuan(Donhang donHang)
        {
            var moiNhat = donHang.Thanhtoans
                .OrderByDescending(x => x.MaThanhToan)
                .FirstOrDefault();

            if (moiNhat == null) return true;
            if (moiNhat.MaPhuongThucNavigation?.TenPhuongThuc == "COD") return true;

            return moiNhat.TrangThaiThanhToan != "ChoThanhToan"
                && moiNhat.TrangThaiThanhToan != "ThatBai";
        }

        private Task<int?> LayMaTaiKhoan()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? result = int.TryParse(userIdStr, out var id) ? id : null;
            return Task.FromResult(result);
        }

        [HttpPost("kiem-tra-truoc-checkout")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> KiemTraCheckout(
            [FromBody] KiemTraDonHangYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();

            if (maTaiKhoan == null)
                return Unauthorized(new { Message = "Vui lòng đăng nhập." });

            var khachHang = await _context.Khachhangs
                .FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);

            if (khachHang == null) return Unauthorized();

            var (tongTienHang, phiShip, soTienGiam, maNhaHang, loi) =
                await TinhTienDonHang(
                    khachHang.MaKhachHang,
                    request.MaGioHang,
                    request.MaKhuyenMai
                );

            if (loi != null)
                return BadRequest(new { Message = loi });

            return Ok(new
            {
                request.MaGioHang,
                MaNhaHang = maNhaHang,
                TongTienHang = tongTienHang,
                PhiShip = phiShip,
                SoTienGiam = soTienGiam,
                ThanhTien = tongTienHang + phiShip - soTienGiam
            });
        }

        [HttpPost("dat-hang")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DatHang(
            [FromBody] DatHangYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();

            if (maTaiKhoan == null)
                return Unauthorized(new { Message = "Vui lòng đăng nhập." });

            var khachHang = await _context.Khachhangs
                .FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);

            if (khachHang == null) return Unauthorized();

            var diaChi = await _context.Diachis.FirstOrDefaultAsync(d =>
                d.MaDiaChi == request.MaDiaChi &&
                d.MaKhachHang == khachHang.MaKhachHang
            );

            if (diaChi == null)
                return BadRequest(new { Message = "Địa chỉ giao hàng không hợp lệ." });

            var (tongTienHang, phiShip, soTienGiam, maNhaHang, loi) =
                await TinhTienDonHang(
                    khachHang.MaKhachHang,
                    request.MaGioHang,
                    request.MaKhuyenMai
                );

            if (loi != null)
                return BadRequest(new { Message = loi });

            var thanhTien = tongTienHang + phiShip - soTienGiam;

            var nhaHangNhanDon = await _context.Nhahangs
                .AsNoTracking()
                .Where(n => n.MaNhaHang == maNhaHang!.Value)
                .Select(n => new
                {
                    n.MaTaiKhoan,
                    n.TenNhaHang
                })
                .FirstOrDefaultAsync();

            if (nhaHangNhanDon == null)
                return BadRequest(new { Message = "Không tìm thấy nhà hàng nhận đơn." });

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var maDonHienThi =
                    $"DH{DateTime.Now:yyMMdd}-{Random.Shared.Next(1000, 9999)}";

                var donHang = new Donhang
                {
                    MaDonHangHienThi = maDonHienThi,
                    MaKhachHang = khachHang.MaKhachHang,
                    MaNhaHang = maNhaHang.Value,
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

                var gioHang = await _context.Giohangs
                    .Include(g => g.Chitietgiohangs)
                        .ThenInclude(ct => ct.MaMonAnNavigation)
                        .ThenInclude(m => m.MaNhomToppings)
                        .ThenInclude(nhom => nhom.Toppings)
                    .Include(g => g.Chitietgiohangs)
                        .ThenInclude(ct => ct.ChitietgiohangToppings)
                    .FirstAsync(g =>
                        g.MaGioHang == request.MaGioHang &&
                        g.MaKhachHang == khachHang.MaKhachHang
                    );

                foreach (var ctGio in gioHang.Chitietgiohangs)
                {
                    var ctDon = new Chitietdonhang
                    {
                        MaDonHang = donHang.MaDonHang,
                        MaMonAn = ctGio.MaMonAn,
                        SoLuong = ctGio.SoLuong,
                        DonGia = ctGio.MaMonAnNavigation.Gia,
                        ThanhTien = 0,
                        GhiChu = ctGio.GhiChu
                    };

                    _context.Chitietdonhangs.Add(ctDon);
                    await _context.SaveChangesAsync();

                    decimal tongTien1Mon = ctGio.MaMonAnNavigation.Gia;

                    var toppingThucTeCuaMon = ctGio.MaMonAnNavigation
                        .MaNhomToppings
                        .SelectMany(n => n.Toppings)
                        .ToList();

                    foreach (var ctTopping in ctGio.ChitietgiohangToppings)
                    {
                        var toppingReal = toppingThucTeCuaMon.First(t =>
                            t.MaTopping == ctTopping.MaTopping
                        );

                        var ctDonTopping = new ChitietdonhangTopping
                        {
                            MaChiTietDonHang = ctDon.MaChiTietDonHang,
                            MaTopping = ctTopping.MaTopping,
                            SoLuong = ctTopping.SoLuong,
                            GiaThemLucDat = toppingReal.GiaThem
                        };

                        _context.ChitietdonhangToppings.Add(ctDonTopping);

                        tongTien1Mon +=
                            toppingReal.GiaThem * ctTopping.SoLuong;
                    }

                    ctDon.ThanhTien = tongTien1Mon * ctGio.SoLuong;
                }

                await _context.SaveChangesAsync();

                if (request.MaKhuyenMai.HasValue)
                {
                    var km = await _context.Khuyenmais
                        .FindAsync(request.MaKhuyenMai);

                    if (km != null)
                        km.SoLuongDaDung += 1;
                }

                _context.Lichsutrangthaidonhangs.Add(
                    new Lichsutrangthaidonhang
                    {
                        MaDonHang = donHang.MaDonHang,
                        MaTrangThai = 1,
                        MaTaiKhoan = maTaiKhoan.Value,
                        ThoiGianTao = DateTime.Now,
                        GhiChu = "Khách hàng đặt đơn mới"
                    }
                );

                var phuongThuc = await _context.Phuongthucthanhtoans
                    .FirstOrDefaultAsync(p =>
                        p.MaPhuongThuc == request.MaPhuongThuc &&
                        p.TrangThai == true
                    );

                if (phuongThuc == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        Message = "Phương thức thanh toán không hợp lệ hoặc đã tắt."
                    });
                }

                var thanhToan = new Thanhtoan
                {
                    MaDonHang = donHang.MaDonHang,
                    MaPhuongThuc = phuongThuc.MaPhuongThuc,
                    SoTien = thanhTien,
                    TrangThaiThanhToan = "ChoThanhToan"
                };

                _context.Thanhtoans.Add(thanhToan);

                Thongbao? thongBaoDonMoi = null;

                if (string.Equals(
                    phuongThuc.TenPhuongThuc,
                    "COD",
                    StringComparison.OrdinalIgnoreCase))
                {
                    var noiDung =
                        $"Bạn có đơn hàng mới {donHang.MaDonHangHienThi}, " +
                        $"trị giá {thanhTien:N0}đ.";

                    thongBaoDonMoi = new Thongbao
                    {
                        MaTaiKhoan = nhaHangNhanDon.MaTaiKhoan,
                        TieuDe = "Bạn có đơn hàng mới",
                        NoiDung = noiDung.Length > 500
                            ? noiDung[..500]
                            : noiDung,
                        Loai = "DonHang",
                        DuongDan = $"/quan/don-hang/{donHang.MaDonHang}",
                        DaDoc = false,
                        NgayTao = DateTime.Now
                    };
                    _context.Thongbaos.Add(thongBaoDonMoi);
                }

                foreach (var ct in gioHang.Chitietgiohangs)
                {
                    _context.ChitietgiohangToppings
                        .RemoveRange(ct.ChitietgiohangToppings);
                }

                _context.Chitietgiohangs
                    .RemoveRange(gioHang.Chitietgiohangs);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (thongBaoDonMoi != null)
                {
                    var thongBaoPayload = new
                    {
                        maThongBao = thongBaoDonMoi.MaThongBao,
                        tieuDe = thongBaoDonMoi.TieuDe,
                        noiDung = thongBaoDonMoi.NoiDung,
                        loai = thongBaoDonMoi.Loai,
                        duongDan = thongBaoDonMoi.DuongDan,
                        daDoc = false,
                        ngayTao = thongBaoDonMoi.NgayTao
                    };

                    var donHangPayload = new
                    {
                        maDonHang = donHang.MaDonHang,
                        maDonHangHienThi = donHang.MaDonHangHienThi,
                        tenNguoiNhan = donHang.TenNguoiNhan,
                        thoiGianDat = donHang.ThoiGianDat,
                        trangThai = "ChoXacNhan",
                        thanhTien = donHang.ThanhTien
                    };

                    try
                    {
                        await Task.WhenAll(
                            _realtime.GuiThongBaoAsync(
                                nhaHangNhanDon.MaTaiKhoan,
                                thongBaoPayload
                            ),
                            _realtime.GuiDonHangMoiAsync(
                                nhaHangNhanDon.MaTaiKhoan,
                                donHangPayload
                            )
                        );
                    }
                    catch (Exception signalRException)
                    {
                        _logger.LogWarning(
                            signalRException,
                            "Đơn {MaDonHang} đã tạo nhưng không gửi được SignalR.",
                            donHang.MaDonHang
                        );
                    }
                }

                return Ok(new
                {
                    Message = "Đặt hàng thành công",
                    MaDonHang = donHang.MaDonHang,
                    MaDonHangHienThi = donHang.MaDonHangHienThi,
                    MaThanhToan = thanhToan.MaThanhToan,
                    TenPhuongThuc = phuongThuc.TenPhuongThuc,
                    ThanhTien = thanhTien
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(
                    500,
                    "Có lỗi xảy ra khi đặt hàng: " + ex.Message
                );
            }
        }

        [HttpGet("cua-toi")]
        [Authorize(Roles = "KhachHang")]
        public async Task<IActionResult> DonHangCuaToi()
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var khachHang = await _context.Khachhangs
                .FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);

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
                    TenNhaHang = d.MaNhaHangNavigation!.TenNhaHang,
                    TrangThai = d.MaTrangThaiNavigation!.TenTrangThai,
                    d.ThanhTien
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> ChiTietDonHang(int id)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var role = User.FindFirstValue(ClaimTypes.Role);

            var donHang = await _context.Donhangs
                .Include(d => d.MaTrangThaiNavigation)
                .Include(d => d.MaNhaHangNavigation)
                .Include(d => d.Chitietdonhangs)
                    .ThenInclude(ct => ct.MaMonAnNavigation)
                .Include(d => d.Chitietdonhangs)
                    .ThenInclude(ct => ct.ChitietdonhangToppings)
                    .ThenInclude(tp => tp.MaToppingNavigation)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (donHang == null)
                return NotFound(new { Message = "Không tìm thấy đơn hàng." });

            if (role == "KhachHang")
            {
                var khachHang = await _context.Khachhangs
                    .FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);

                if (khachHang == null ||
                    donHang.MaKhachHang != khachHang.MaKhachHang)
                {
                    return StatusCode(403, new
                    {
                        Message = "Bạn không có quyền xem đơn hàng này."
                    });
                }
            }
            else if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs
                    .FirstOrDefaultAsync(n => n.MaTaiKhoan == maTaiKhoan);

                if (nhaHang == null ||
                    donHang.MaNhaHang != nhaHang.MaNhaHang)
                {
                    return StatusCode(403, new
                    {
                        Message = "Đơn hàng này không thuộc quán của bạn."
                    });
                }
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
                TrangThai =
                    donHang.MaTrangThaiNavigation?.TenTrangThai ?? "",
                TenNhaHang =
                    donHang.MaNhaHangNavigation?.TenNhaHang ?? "",
                donHang.TongTienHang,
                donHang.PhiShip,
                donHang.SoTienGiam,
                donHang.ThanhTien,
                ChiTiet = donHang.Chitietdonhangs.Select(ct => new
                {
                    ct.MaMonAn,
                    TenMonAn =
                        ct.MaMonAnNavigation?.TenMonAn ?? "",
                    ct.SoLuong,
                    ct.DonGia,
                    ct.ThanhTien,
                    Toppings = ct.ChitietdonhangToppings.Select(tp => new
                    {
                        TenTopping =
                            tp.MaToppingNavigation?.TenTopping ?? "",
                        GiaThem = tp.GiaThemLucDat,
                        tp.SoLuong
                    })
                })
            });
        }

        [HttpGet("~/api/nha-hang/don-hang")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> DanhSachDonHangCuaQuan(
            [FromQuery] int? maTrangThai)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(n => n.MaTaiKhoan == maTaiKhoan);

            if (nhaHang == null) return Unauthorized();

            var query = _context.Donhangs
                .Where(d => d.MaNhaHang == nhaHang.MaNhaHang);

            if (maTrangThai.HasValue)
            {
                query = query.Where(d =>
                    d.MaTrangThai == maTrangThai
                );
            }

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
                    TrangThai =
                        d.MaTrangThaiNavigation!.TenTrangThai,
                    d.ThanhTien
                })
                .ToList();

            return Ok(danhSach);
        }

        [HttpPut("{id}/huy")]
        [Authorize]
        public async Task<IActionResult> HuyDonHang(
            int id,
            [FromBody] HuyDonHangYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();
            if (maTaiKhoan == null) return Unauthorized();

            var role = User.FindFirstValue(ClaimTypes.Role);

            var donHang = await _context.Donhangs.FindAsync(id);

            if (donHang == null)
                return NotFound(new { Message = "Đơn hàng không tồn tại." });

            if (role == "KhachHang")
            {
                var khachHang = await _context.Khachhangs
                    .FirstOrDefaultAsync(k => k.MaTaiKhoan == maTaiKhoan);

                if (khachHang == null ||
                    donHang.MaKhachHang != khachHang.MaKhachHang)
                {
                    return StatusCode(403, new
                    {
                        Message = "Bạn không có quyền huỷ đơn hàng này."
                    });
                }
            }
            else if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs
                    .FirstOrDefaultAsync(n => n.MaTaiKhoan == maTaiKhoan);

                if (nhaHang == null ||
                    donHang.MaNhaHang != nhaHang.MaNhaHang)
                {
                    return StatusCode(403, new
                    {
                        Message = "Đơn hàng này không thuộc quán của bạn."
                    });
                }
            }

            if (donHang.MaTrangThai > 2)
            {
                return BadRequest(new
                {
                    Message = "Không thể huỷ đơn hàng ở trạng thái hiện tại."
                });
            }

            var taiKhoanNhanThongBao = await _context.Khachhangs
                .Where(x => x.MaKhachHang == donHang.MaKhachHang)
                .Select(x => x.MaTaiKhoan)
                .Union(
                    _context.Nhahangs
                        .Where(x => x.MaNhaHang == donHang.MaNhaHang)
                        .Select(x => x.MaTaiKhoan)
                )
                .Where(x => x != maTaiKhoan.Value)
                .ToListAsync();

            donHang.MaTrangThai = 6;
            donHang.LyDoHuy = request.LyDoHuy;

            _context.Lichsutrangthaidonhangs.Add(
                new Lichsutrangthaidonhang
                {
                    MaDonHang = donHang.MaDonHang,
                    MaTrangThai = 6,
                    MaTaiKhoan = maTaiKhoan.Value,
                    ThoiGianTao = DateTime.Now,
                    GhiChu = $"Huỷ đơn. Lý do: {request.LyDoHuy}"
                }
            );

            var nguoiHuy = role switch
            {
                "KhachHang" => "Khách hàng",
                "Quan" => "Quán",
                _ => "Hệ thống"
            };

            var lyDo = request.LyDoHuy?.Trim();

            var noiDungThongBao =
                $"{nguoiHuy} đã hủy đơn {donHang.MaDonHangHienThi}.";

            if (!string.IsNullOrWhiteSpace(lyDo))
                noiDungThongBao += $" Lý do: {lyDo}";

            var thongBaoHuyDaTao =
                new List<(int MaTaiKhoan, Thongbao ThongBao)>();

            foreach (var taiKhoanNhan in taiKhoanNhanThongBao)
            {
                var thongBao = new Thongbao
                {
                    MaTaiKhoan = taiKhoanNhan,
                    TieuDe = "Đơn hàng đã bị hủy",
                    NoiDung = noiDungThongBao.Length > 500
                        ? noiDungThongBao[..500]
                        : noiDungThongBao,
                    Loai = "DonHang",
                    DuongDan = User.IsInRole("KhachHang")
                        ? $"/quan/don-hang/{donHang.MaDonHang}"
                        : $"/don-hang/{donHang.MaDonHang}",
                    DaDoc = false,
                    NgayTao = DateTime.Now
                };

                _context.Thongbaos.Add(thongBao);
                thongBaoHuyDaTao.Add((taiKhoanNhan, thongBao));
            }

            await _context.SaveChangesAsync();

            foreach (var item in thongBaoHuyDaTao)
            {
                var thongBaoPayload = new
                {
                    maThongBao = item.ThongBao.MaThongBao,
                    tieuDe = item.ThongBao.TieuDe,
                    noiDung = item.ThongBao.NoiDung,
                    loai = item.ThongBao.Loai,
                    duongDan = item.ThongBao.DuongDan,
                    daDoc = false,
                    ngayTao = item.ThongBao.NgayTao
                };

                var donHangPayload = new
                {
                    maDonHang = donHang.MaDonHang,
                    maDonHangHienThi = donHang.MaDonHangHienThi,
                    trangThai = "DaHuy",
                    lyDoHuy = donHang.LyDoHuy
                };

                try
                {
                    await Task.WhenAll(
                        _realtime.GuiThongBaoAsync(
                            item.MaTaiKhoan,
                            thongBaoPayload
                        ),
                        _realtime.GuiDonHangDaHuyAsync(
                            item.MaTaiKhoan,
                            donHangPayload
                        )
                    );
                }
                catch (Exception signalRException)
                {
                    _logger.LogWarning(
                        signalRException,
                        "Đơn {MaDonHang} đã hủy nhưng không gửi được SignalR cho tài khoản {MaTaiKhoan}.",
                        donHang.MaDonHang,
                        item.MaTaiKhoan
                    );
                }
            }

            return Ok(new
            {
                Message = "Huỷ đơn hàng thành công."
            });
        }

        [HttpGet("~/api/trang-thai-don-hang")]
        [Authorize]
        public async Task<IActionResult> GetDanhSachTrangThaiDonHang()
        {
            var maTaiKhoan = await LayMaTaiKhoan();

            if (maTaiKhoan == null)
                return Unauthorized(new { message = "Token không hợp lệ." });

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

            if (maTaiKhoan == null)
                return Unauthorized(new { message = "Token không hợp lệ." });

            var donHang = await _context.Donhangs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.MaDonHang == id);

            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng." });

            var role = User.FindFirstValue(ClaimTypes.Role);

            var duocXem = await KiemTraQuyenXemDonHang(
                role,
                maTaiKhoan.Value,
                donHang
            );

            if (duocXem == false)
            {
                return StatusCode(403, new
                {
                    message = "Bạn không có quyền xem đơn hàng này."
                });
            }

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
                    tenTrangThai =
                        x.MaTrangThaiNavigation.TenTrangThai,
                    x.MaTaiKhoan,
                    x.ThoiGianTao,
                    x.GhiChu
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpPut("{id:int}/trang-thai")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> CapNhatTrangThaiDonHang(
            int id,
            CapNhatTrangThaiYeuCau request)
        {
            var maTaiKhoan = await LayMaTaiKhoan();

            if (maTaiKhoan == null)
                return Unauthorized(new { message = "Token không hợp lệ." });

            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value
                );

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            var donHang = await _context.Donhangs
                .Include(x => x.Thanhtoans)
                    .ThenInclude(x => x.MaPhuongThucNavigation)
                .FirstOrDefaultAsync(x => x.MaDonHang == id);

            if (donHang == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng." });

            if (donHang.MaNhaHang != nhaHang.MaNhaHang)
            {
                return StatusCode(403, new
                {
                    message = "Đơn hàng này không thuộc quán của bạn."
                });
            }

            if (donHang.MaTrangThai == 5)
            {
                return BadRequest(new
                {
                    message = "Đơn hàng đã hoàn thành, không thể cập nhật trạng thái."
                });
            }

            if (donHang.MaTrangThai == 6)
            {
                return BadRequest(new
                {
                    message = "Đơn hàng đã huỷ, không thể cập nhật trạng thái."
                });
            }

            if (request.MaTrangThai != donHang.MaTrangThai + 1 ||
                request.MaTrangThai > 5)
            {
                return BadRequest(new
                {
                    message = "Chỉ được chuyển sang trạng thái kế tiếp theo thứ tự."
                });
            }

            var trangThaiMoi = await _context.Trangthaidonhangs
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.MaTrangThai == request.MaTrangThai
                );

            if (trangThaiMoi == null)
                return BadRequest(new { message = "Mã trạng thái không hợp lệ." });

            var maTaiKhoanKhach = await _context.Khachhangs
                .AsNoTracking()
                .Where(x => x.MaKhachHang == donHang.MaKhachHang)
                .Select(x => (int?)x.MaTaiKhoan)
                .FirstOrDefaultAsync();

            if (maTaiKhoanKhach == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy khách hàng của đơn hàng."
                });
            }

            donHang.MaTrangThai = request.MaTrangThai;

            if (request.MaTrangThai == 5)
            {
                donHang.ThoiGianGiaoThucTe = DateTime.Now;

                var thanhToanCod = donHang.Thanhtoans
                    .Where(x =>
                        x.TrangThaiThanhToan == "ChoThanhToan" &&
                        x.MaPhuongThucNavigation.TenPhuongThuc == "COD"
                    )
                    .OrderByDescending(x => x.MaThanhToan)
                    .FirstOrDefault();

                if (thanhToanCod != null)
                {
                    thanhToanCod.TrangThaiThanhToan = "ThanhCong";
                    thanhToanCod.ThoiGianThanhToan = DateTime.Now;
                }
            }

            _context.Lichsutrangthaidonhangs.Add(
                new Lichsutrangthaidonhang
                {
                    MaDonHang = donHang.MaDonHang,
                    MaTrangThai = request.MaTrangThai,
                    MaTaiKhoan = maTaiKhoan.Value,
                    ThoiGianTao = DateTime.Now,
                    GhiChu = string.IsNullOrWhiteSpace(request.GhiChu)
                        ? $"Quán cập nhật trạng thái: {trangThaiMoi.TenTrangThai}"
                        : request.GhiChu.Trim()
                }
            );

            var noiDungThongBao = request.MaTrangThai switch
            {
                2 =>
                    $"Quán {nhaHang.TenNhaHang} đã xác nhận đơn {donHang.MaDonHangHienThi}.",
                3 =>
                    $"Quán {nhaHang.TenNhaHang} đang chuẩn bị đơn {donHang.MaDonHangHienThi}.",
                4 =>
                    $"Đơn {donHang.MaDonHangHienThi} đang được giao đến bạn.",
                5 =>
                    $"Đơn {donHang.MaDonHangHienThi} đã hoàn thành. Bạn có thể đánh giá quán và món ăn.",
                _ =>
                    $"Đơn {donHang.MaDonHangHienThi} đã cập nhật trạng thái."
            };

            var thongBaoCapNhat = new Thongbao
            {
                MaTaiKhoan = maTaiKhoanKhach.Value,
                TieuDe = "Cập nhật đơn hàng",
                NoiDung = noiDungThongBao.Length > 500
                    ? noiDungThongBao[..500]
                    : noiDungThongBao,
                Loai = "DonHang",
                DuongDan = $"/don-hang/{donHang.MaDonHang}",
                DaDoc = false,
                NgayTao = DateTime.Now
            };

            _context.Thongbaos.Add(thongBaoCapNhat);
            await _context.SaveChangesAsync();

            var thongBaoPayload = new
            {
                maThongBao = thongBaoCapNhat.MaThongBao,
                tieuDe = thongBaoCapNhat.TieuDe,
                noiDung = thongBaoCapNhat.NoiDung,
                loai = thongBaoCapNhat.Loai,
                duongDan = thongBaoCapNhat.DuongDan,
                daDoc = false,
                ngayTao = thongBaoCapNhat.NgayTao
            };

            var donHangPayload = new
            {
                maDonHang = donHang.MaDonHang,
                maDonHangHienThi = donHang.MaDonHangHienThi,
                maTrangThai = donHang.MaTrangThai,
                tenTrangThai = trangThaiMoi.TenTrangThai
            };

            try
            {
                await Task.WhenAll(
                    _realtime.GuiThongBaoAsync(
                        maTaiKhoanKhach.Value,
                        thongBaoPayload
                    ),
                    _realtime.GuiDonHangCapNhatAsync(
                        maTaiKhoanKhach.Value,
                        donHangPayload
                    )
                );
            }
            catch (Exception signalRException)
            {
                _logger.LogWarning(
                    signalRException,
                    "Đơn {MaDonHang} đã cập nhật nhưng không gửi được SignalR.",
                    donHang.MaDonHang
                );
            }

            return Ok(new
            {
                message = "Cập nhật trạng thái đơn hàng thành công.",
                maDonHang = donHang.MaDonHang,
                maTrangThai = donHang.MaTrangThai,
                tenTrangThai = trangThaiMoi.TenTrangThai
            });
        }

        private async Task<bool?> KiemTraQuyenXemDonHang(
            string? role,
            int maTaiKhoan,
            Donhang donHang)
        {
            if (role == "KhachHang")
            {
                var khachHang = await _context.Khachhangs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x =>
                        x.MaTaiKhoan == maTaiKhoan
                    );

                if (khachHang == null) return null;

                return donHang.MaKhachHang ==
                       khachHang.MaKhachHang;
            }

            if (role == "Quan")
            {
                var nhaHang = await _context.Nhahangs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x =>
                        x.MaTaiKhoan == maTaiKhoan
                    );

                if (nhaHang == null) return null;

                return donHang.MaNhaHang ==
                       nhaHang.MaNhaHang;
            }

            if (role == "Admin") return true;

            return false;
        }

        private async Task<(
            decimal TongTien,
            decimal PhiShip,
            decimal Giam,
            int? MaNhaHang,
            string? Loi
        )> TinhTienDonHang(
            int maKhachHang,
            int maGioHang,
            int? maKhuyenMai)
        {
            var gioHang = await _context.Giohangs
                .Include(g => g.Chitietgiohangs)
                    .ThenInclude(ct => ct.MaMonAnNavigation)
                    .ThenInclude(m => m.MaNhomToppings)
                    .ThenInclude(nhom => nhom.Toppings)
                .Include(g => g.Chitietgiohangs)
                    .ThenInclude(ct => ct.ChitietgiohangToppings)
                .FirstOrDefaultAsync(g =>
                    g.MaGioHang == maGioHang &&
                    g.MaKhachHang == maKhachHang
                );

            if (gioHang != null &&
                gioHang.Chitietgiohangs.Any() &&
                gioHang.NgayCapNhat <= DateTime.Now.Subtract(ThoiHanGioHang))
            {
                foreach (var chiTiet in gioHang.Chitietgiohangs)
                {
                    _context.ChitietgiohangToppings
                        .RemoveRange(chiTiet.ChitietgiohangToppings);
                }

                _context.Chitietgiohangs.RemoveRange(gioHang.Chitietgiohangs);
                gioHang.NgayCapNhat = DateTime.Now;
                await _context.SaveChangesAsync();

                return (
                    0,
                    0,
                    0,
                    null,
                    "Giỏ hàng đã hết hạn sau 5 phút không hoạt động."
                );
            }

            if (gioHang == null ||
                !gioHang.Chitietgiohangs.Any())
            {
                return (0, 0, 0, null, "Giỏ hàng trống.");
            }

            var maNhaHang = gioHang.Chitietgiohangs
                .First()
                .MaMonAnNavigation
                .MaNhaHang;

            var nhaHang = await _context.Nhahangs
                .FindAsync(maNhaHang);

            if (nhaHang == null)
                return (0, 0, 0, null, "Không tìm thấy nhà hàng.");

            var trangThaiNhaHang =
                TrangThaiNhaHangHelper.KiemTra(nhaHang);

            if (!trangThaiNhaHang.DangMoCua)
            {
                return (
                    0,
                    0,
                    0,
                    null,
                    trangThaiNhaHang.TrangThaiHienThi
                );
            }

            decimal tongTienHang = 0;

            foreach (var ct in gioHang.Chitietgiohangs)
            {
                if (ct.MaMonAnNavigation.MaNhaHang != maNhaHang)
                {
                    return (
                        0,
                        0,
                        0,
                        null,
                        "Giỏ hàng có món không thuộc nhà hàng này."
                    );
                }

                if (ct.MaMonAnNavigation.TrangThai == false)
                {
                    return (
                        0,
                        0,
                        0,
                        null,
                        $"Món {ct.MaMonAnNavigation.TenMonAn} đã ngưng bán."
                    );
                }

                if (ct.ChitietgiohangToppings.Any(tp => tp.SoLuong != 1))
                {
                    return (
                        0,
                        0,
                        0,
                        null,
                        "Số lượng topping trong giỏ không hợp lệ. Vui lòng xóa món và chọn lại."
                    );
                }

                var loiTopping = ToppingValidator.KiemTra(
                    ct.MaMonAnNavigation,
                    ct.ChitietgiohangToppings
                        .Select(tp => tp.MaTopping)
                        .ToArray()
                );

                if (loiTopping != null)
                {
                    return (
                        0,
                        0,
                        0,
                        null,
                        $"Món {ct.MaMonAnNavigation.TenMonAn}: {loiTopping} Vui lòng xóa món khỏi giỏ và chọn lại."
                    );
                }

                decimal giaToppingThucTe = 0;

                var maToppingsTrongGio = ct.ChitietgiohangToppings
                    .Select(t => t.MaTopping)
                    .ToList();

                var toppingsThucTe = ct.MaMonAnNavigation
                    .MaNhomToppings
                    .SelectMany(n => n.Toppings)
                    .Where(t =>
                        maToppingsTrongGio.Contains(t.MaTopping)
                    )
                    .ToList();

                foreach (var tp in ct.ChitietgiohangToppings)
                {
                    var realTp = toppingsThucTe.FirstOrDefault(t =>
                        t.MaTopping == tp.MaTopping
                    );

                    if (realTp != null)
                    {
                        giaToppingThucTe +=
                            realTp.GiaThem * tp.SoLuong;
                    }
                }

                tongTienHang +=
                    (ct.MaMonAnNavigation.Gia + giaToppingThucTe) *
                    ct.SoLuong;
            }

            decimal phiShip = nhaHang.PhiShipMacDinh;
            decimal soTienGiam = 0;

            if (maKhuyenMai.HasValue)
            {
                var km = await _context.Khuyenmais
                    .FindAsync(maKhuyenMai.Value);

                if (km == null || km.TrangThai == false)
                    return (0, 0, 0, null, "Mã khuyến mãi không hợp lệ.");

                if (DateTime.Now < km.NgayBatDau ||
                    DateTime.Now > km.NgayKetThuc)
                {
                    return (
                        0,
                        0,
                        0,
                        null,
                        "Mã khuyến mãi hết hạn hoặc chưa đến giờ."
                    );
                }

                if (km.SoLuongDaDung >= km.SoLuong)
                    return (0, 0, 0, null, "Mã khuyến mãi đã hết lượt.");

                if (tongTienHang < km.DonHangToiThieu)
                {
                    return (
                        0,
                        0,
                        0,
                        null,
                        $"Đơn hàng chưa đạt tối thiểu {km.DonHangToiThieu} để áp dụng mã."
                    );
                }

                if (km.MaNhaHang.HasValue &&
                    km.MaNhaHang != maNhaHang)
                {
                    return (
                        0,
                        0,
                        0,
                        null,
                        "Mã khuyến mãi không áp dụng cho quán này."
                    );
                }

                soTienGiam = km.LoaiGiam == "SoTien"
                    ? km.GiaTriGiam
                    : tongTienHang * km.GiaTriGiam / 100;

                if (km.GiamToiDa.HasValue &&
                    soTienGiam > km.GiamToiDa.Value)
                {
                    soTienGiam = km.GiamToiDa.Value;
                }
            }

            soTienGiam = Math.Min(
                Math.Max(soTienGiam, 0m),
                Math.Max(tongTienHang, 0m)
            );

            return (
                tongTienHang,
                phiShip,
                soTienGiam,
                maNhaHang,
                null
            );
        }
    }

    public class KiemTraDonHangYeuCau
    {
        [Range(1, int.MaxValue)]
        public int MaGioHang { get; set; }

        public int? MaKhuyenMai { get; set; }
    }

    public class DatHangYeuCau
    {
        [Range(1, int.MaxValue)]
        public int MaGioHang { get; set; }

        [Required]
        public int MaDiaChi { get; set; }

        [Required]
        public int MaPhuongThuc { get; set; }

        public int? MaKhuyenMai { get; set; }

        public string? GhiChu { get; set; }
    }

    public class HuyDonHangYeuCau
    {
        [Required]
        public string LyDoHuy { get; set; } =
            string.Empty;
    }

    public class CapNhatTrangThaiYeuCau
    {
        [Required]
        public int MaTrangThai { get; set; }

        [MaxLength(200)]
        public string? GhiChu { get; set; }
    }
}
