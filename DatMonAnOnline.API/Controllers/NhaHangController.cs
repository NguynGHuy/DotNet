using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/nha-hang")]
    [ApiController]
    public class NhaHangController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public NhaHangController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        public class UpdateNhaHangDto
        {
            [Required, MaxLength(150)]
            public string TenNhaHang { get; set; } = string.Empty;

            [MaxLength(500)]
            public string? MoTa { get; set; }

            [Required, MaxLength(255)]
            public string DiaChiQuan { get; set; } = string.Empty;

            [MaxLength(255)]
            public string? AnhBia { get; set; }

            public TimeOnly? GioMoCua { get; set; }

            public TimeOnly? GioDongCua { get; set; }

            public decimal PhiShipMacDinh { get; set; }
        }

        public class UpdateCheDoHoatDongDto
        {
            [Required]
            public string CheDoHoatDong { get; set; } = string.Empty;
        }

        // =====================================================
        // PUBLIC: DANH SÁCH NHÀ HÀNG
        // =====================================================

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetDanhSachNhaHang()
        {
            var danhSach = await _context.Nhahangs
                .AsNoTracking()
                .Where(x => x.TrangThaiDuyet == "DaDuyet")
                .OrderBy(x => x.TenNhaHang)
                .ToListAsync();

            var result = danhSach.Select(x =>
            {
                var trangThai =
                    TrangThaiNhaHangHelper.KiemTra(x);

                return new
                {
                    x.MaNhaHang,
                    x.TenNhaHang,
                    x.MoTa,
                    x.DiaChiQuan,
                    x.AnhBia,
                    x.GioMoCua,
                    x.GioDongCua,

                    // Giữ lại để tương thích code cũ
                    x.TrangThaiHoatDong,

                    // Thông tin mới
                    x.CheDoHoatDong,
                    trangThai.DangMoCua,
                    trangThai.TrangThaiHienThi,

                    x.DanhGiaTrungBinh,
                    x.PhiShipMacDinh
                };
            });

            return Ok(result);
        }

        // =====================================================
        // PUBLIC: CHI TIẾT NHÀ HÀNG
        // =====================================================

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetChiTietNhaHang(int id)
        {
            var nhaHang = await _context.Nhahangs
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.MaNhaHang == id &&
                    x.TrangThaiDuyet == "DaDuyet"
                );

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy nhà hàng hoặc nhà hàng chưa được duyệt."
                });
            }

            var trangThai =
                TrangThaiNhaHangHelper.KiemTra(nhaHang);

            return Ok(new
            {
                nhaHang.MaNhaHang,
                nhaHang.TenNhaHang,
                nhaHang.MoTa,
                nhaHang.DiaChiQuan,
                nhaHang.AnhBia,
                nhaHang.GioMoCua,
                nhaHang.GioDongCua,

                // Giữ lại để tương thích code cũ
                nhaHang.TrangThaiHoatDong,

                // Thông tin trạng thái mới
                nhaHang.CheDoHoatDong,
                trangThai.DangMoCua,
                trangThai.TrangThaiHienThi,

                nhaHang.DanhGiaTrungBinh,
                nhaHang.PhiShipMacDinh
            });
        }

        // =====================================================
        // QUÁN: LẤY HỒ SƠ NHÀ HÀNG
        // =====================================================

        [HttpGet("ho-so")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> GetHoSoQuan()
        {
            var maTaiKhoan = GetMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Token không hợp lệ."
                });
            }

            var nhaHang = await _context.Nhahangs
                .AsNoTracking()
                .Include(x => x.MaTaiKhoanNavigation)
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value
                );

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            var trangThai =
                TrangThaiNhaHangHelper.KiemTra(nhaHang);

            return Ok(new
            {
                nhaHang.MaNhaHang,
                nhaHang.MaTaiKhoan,
                nhaHang.TenNhaHang,
                nhaHang.MoTa,
                nhaHang.DiaChiQuan,
                nhaHang.AnhBia,
                nhaHang.GioMoCua,
                nhaHang.GioDongCua,
                nhaHang.TrangThaiDuyet,

                // Giữ lại để tương thích code cũ
                nhaHang.TrangThaiHoatDong,

                // Thông tin trạng thái mới
                nhaHang.CheDoHoatDong,
                trangThai.DangMoCua,
                trangThai.TrangThaiHienThi,

                nhaHang.DanhGiaTrungBinh,
                nhaHang.PhiShipMacDinh,

                email = nhaHang.MaTaiKhoanNavigation.Email,
                soDienThoai =
                    nhaHang.MaTaiKhoanNavigation.SoDienThoai
            });
        }

        // =====================================================
        // QUÁN: CẬP NHẬT HỒ SƠ
        // =====================================================

        [HttpPut("ho-so")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateHoSoQuan(
            UpdateNhaHangDto request
        )
        {
            var maTaiKhoan = GetMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Token không hợp lệ."
                });
            }

            if (request.PhiShipMacDinh < 0)
            {
                return BadRequest(new
                {
                    message = "PhiShipMacDinh không được âm."
                });
            }

            if (request.GioMoCua.HasValue &&
                request.GioDongCua.HasValue &&
                request.GioMoCua == request.GioDongCua)
            {
                return BadRequest(new
                {
                    message =
                        "Giờ mở cửa và giờ đóng cửa không được giống nhau."
                });
            }

            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value
                );

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            nhaHang.TenNhaHang =
                request.TenNhaHang.Trim();

            nhaHang.MoTa =
                string.IsNullOrWhiteSpace(request.MoTa)
                    ? null
                    : request.MoTa.Trim();

            nhaHang.DiaChiQuan =
                request.DiaChiQuan.Trim();

            nhaHang.AnhBia =
                string.IsNullOrWhiteSpace(request.AnhBia)
                    ? null
                    : request.AnhBia.Trim();

            nhaHang.GioMoCua =
                request.GioMoCua;

            nhaHang.GioDongCua =
                request.GioDongCua;

            nhaHang.PhiShipMacDinh =
                request.PhiShipMacDinh;

            await _context.SaveChangesAsync();

            var trangThai =
                TrangThaiNhaHangHelper.KiemTra(nhaHang);

            return Ok(new
            {
                message =
                    "Cập nhật hồ sơ nhà hàng thành công.",

                nhaHang.CheDoHoatDong,
                trangThai.DangMoCua,
                trangThai.TrangThaiHienThi
            });
        }

        // =====================================================
        // QUÁN: CẬP NHẬT CHẾ ĐỘ HOẠT ĐỘNG
        // =====================================================

        [HttpPut("trang-thai-hoat-dong")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateTrangThai(
            UpdateCheDoHoatDongDto request
        )
        {
            var cheDo = request.CheDoHoatDong.Trim();

            var cheDoHopLe = new[]
            {
                "TuDong",
                "MoThuCong",
                "TamNgung"
            };

            if (!cheDoHopLe.Contains(cheDo))
            {
                return BadRequest(new
                {
                    message =
                        "CheDoHoatDong chỉ nhận TuDong, MoThuCong hoặc TamNgung."
                });
            }

            var maTaiKhoan = GetMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Token không hợp lệ."
                });
            }

            var nhaHang = await _context.Nhahangs
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value
                );

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            if (nhaHang.TrangThaiDuyet != "DaDuyet")
            {
                return BadRequest(new
                {
                    message =
                        "Nhà hàng chưa được Admin duyệt nên chưa thể nhận đơn."
                });
            }

            nhaHang.CheDoHoatDong = cheDo;

            /*
             * Cột cũ được giữ để code cũ chưa sửa không bị lỗi.
             * Sau này mọi màn hình sẽ sử dụng DangMoCua.
             */
            if (cheDo == "TamNgung")
            {
                nhaHang.TrangThaiHoatDong = "TamNgung";
            }
            else if (cheDo == "MoThuCong")
            {
                nhaHang.TrangThaiHoatDong = "MoCua";
            }
            else
            {
                var ketQuaTuDong =
                    TrangThaiNhaHangHelper.KiemTra(nhaHang);

                nhaHang.TrangThaiHoatDong =
                    ketQuaTuDong.DangMoCua
                        ? "MoCua"
                        : "DongCua";
            }

            await _context.SaveChangesAsync();

            var trangThai =
                TrangThaiNhaHangHelper.KiemTra(nhaHang);

            return Ok(new
            {
                message =
                    "Cập nhật chế độ hoạt động thành công.",

                nhaHang.CheDoHoatDong,
                trangThai.DangMoCua,
                trangThai.TrangThaiHienThi
            });
        }

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.TryParse(value, out var id)
                ? id
                : null;
        }
    }

    // =========================================================
    // LOGIC XÁC ĐỊNH TRẠNG THÁI THỰC TẾ
    // =========================================================

    internal static class TrangThaiNhaHangHelper
    {
        public static (
            bool DangMoCua,
            string TrangThaiHienThi
        ) KiemTra(
            Nhahang nhaHang,
            DateTime? thoiDiem = null
        )
        {
            if (nhaHang.TrangThaiDuyet != "DaDuyet")
            {
                return (
                    false,
                    "Nhà hàng chưa được duyệt"
                );
            }

            if (nhaHang.CheDoHoatDong == "MoThuCong")
            {
                return (
                    true,
                    "Đang mở cửa thủ công"
                );
            }

            if (nhaHang.CheDoHoatDong == "TamNgung")
            {
                return (
                    false,
                    "Nhà hàng đang tạm ngưng"
                );
            }

            if (nhaHang.CheDoHoatDong != "TuDong")
            {
                return (
                    false,
                    "Chế độ hoạt động không hợp lệ"
                );
            }

            if (!nhaHang.GioMoCua.HasValue ||
                !nhaHang.GioDongCua.HasValue)
            {
                return (
                    false,
                    "Nhà hàng chưa thiết lập giờ hoạt động"
                );
            }

            var gioMoCua =
                nhaHang.GioMoCua.Value;

            var gioDongCua =
                nhaHang.GioDongCua.Value;

            if (gioMoCua == gioDongCua)
            {
                return (
                    false,
                    "Giờ hoạt động chưa hợp lệ"
                );
            }

            var hienTai = TimeOnly.FromDateTime(
                thoiDiem ?? DateTime.Now
            );

            bool dangTrongGioHoatDong;

            if (gioMoCua < gioDongCua)
            {
                dangTrongGioHoatDong =
                    hienTai >= gioMoCua &&
                    hienTai < gioDongCua;
            }
            else
            {
                // Khung giờ đi qua nửa đêm
                dangTrongGioHoatDong =
                    hienTai >= gioMoCua ||
                    hienTai < gioDongCua;
            }

            if (dangTrongGioHoatDong)
            {
                return (
                    true,
                    "Đang mở cửa theo giờ hoạt động"
                );
            }

            return (
                false,
                "Ngoài giờ hoạt động"
            );
        }
    }
}