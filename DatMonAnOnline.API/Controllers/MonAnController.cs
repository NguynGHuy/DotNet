using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/mon-an")]
    [ApiController]
    public class MonAnController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public MonAnController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        // =========================================================
        // REQUEST MODELS
        // =========================================================

        public class TaoMonAnRequest
        {
            [Range(1, int.MaxValue)]
            public int MaDanhMuc { get; set; }

            [Required, MaxLength(150)]
            public string TenMonAn { get; set; } = string.Empty;

            [MaxLength(500)]
            public string? MoTa { get; set; }

            [Range(typeof(decimal), "0", "79228162514264337593543950335")]
            public decimal Gia { get; set; }

            [MaxLength(255)]
            public string? HinhAnh { get; set; }
        }

        public class CapNhatMonAnRequest
        {
            [Range(1, int.MaxValue)]
            public int MaDanhMuc { get; set; }

            [Required, MaxLength(150)]
            public string TenMonAn { get; set; } = string.Empty;

            [MaxLength(500)]
            public string? MoTa { get; set; }

            [Range(typeof(decimal), "0", "79228162514264337593543950335")]
            public decimal Gia { get; set; }

            [MaxLength(255)]
            public string? HinhAnh { get; set; }
        }

        public class CapNhatTrangThaiMonAnRequest
        {
            public bool TrangThai { get; set; }
        }

        // =========================================================
        // GET /api/mon-an?maNhaHang={id}
        // PUBLIC
        // =========================================================

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetMonAns(
            [FromQuery] int maNhaHang)
        {
            if (maNhaHang <= 0)
            {
                return BadRequest(new
                {
                    message = "MaNhaHang không hợp lệ."
                });
            }

            var nhaHangTonTai = await _context.Nhahangs
                .AsNoTracking()
                .AnyAsync(x =>
                    x.MaNhaHang == maNhaHang &&
                    x.TrangThaiDuyet == "DaDuyet");

            if (!nhaHangTonTai)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhà hàng hoặc nhà hàng chưa được duyệt."
                });
            }

            var result = await _context.Monans
                .AsNoTracking()
                .Where(x => x.MaNhaHang == maNhaHang)
                .OrderBy(x => x.MaDanhMuc)
                .ThenBy(x => x.TenMonAn)
                .Select(x => new
                {
                    x.MaMonAn,
                    x.MaNhaHang,
                    x.MaDanhMuc,
                    TenDanhMuc = x.MaDanhMucNavigation.TenDanhMuc,
                    x.TenMonAn,
                    x.MoTa,
                    x.Gia,
                    x.HinhAnh,
                    x.TrangThai,
                    x.DanhGiaTrungBinh
                })
                .ToListAsync();

            return Ok(result);
        }

        // =========================================================
        // GET /api/mon-an/{id}
        // PUBLIC
        // Chi tiết món + danh sách nhóm topping
        // =========================================================

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMonAn(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "MaMonAn không hợp lệ."
                });
            }

            var monAn = await _context.Monans
                .AsNoTracking()
                .Include(x => x.MaDanhMucNavigation)
                .Include(x => x.MaNhaHangNavigation)
                .Include(x => x.MaNhomToppings)
                .FirstOrDefaultAsync(x => x.MaMonAn == id);

            if (monAn == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn."
                });
            }

            if (monAn.MaNhaHangNavigation.TrangThaiDuyet != "DaDuyet")
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn."
                });
            }

            var result = new
            {
                monAn.MaMonAn,
                monAn.MaNhaHang,
                monAn.MaDanhMuc,
                tenDanhMuc = monAn.MaDanhMucNavigation.TenDanhMuc,
                monAn.TenMonAn,
                monAn.MoTa,
                monAn.Gia,
                monAn.HinhAnh,
                monAn.TrangThai,
                monAn.DanhGiaTrungBinh,

                nhomToppings = monAn.MaNhomToppings
                    .OrderBy(x => x.MaNhomTopping)
                    .Select(x => new
                    {
                        x.MaNhomTopping,
                        x.TenNhom,
                        x.BatBuocChon,
                        x.ChonToiDa
                    })
                    .ToList()
            };

            return Ok(result);
        }

        // =========================================================
        // POST /api/mon-an
        // QUÁN
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> CreateMonAn(
            TaoMonAnRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TenMonAn))
            {
                return BadRequest(new
                {
                    message = "Tên món ăn không được để trống."
                });
            }

            if (request.Gia < 0)
            {
                return BadRequest(new
                {
                    message = "Giá món ăn không được âm."
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
                    x.MaTaiKhoan == maTaiKhoan.Value);

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            if (nhaHang.TrangThaiDuyet != "DaDuyet")
            {
                return BadRequest(new
                {
                    message = "Nhà hàng chưa được Admin duyệt."
                });
            }

            // Kiểm tra danh mục có thuộc đúng nhà hàng không
            var danhMuc = await _context.Danhmucs
                .FirstOrDefaultAsync(x =>
                    x.MaDanhMuc == request.MaDanhMuc &&
                    x.MaNhaHang == nhaHang.MaNhaHang);

            if (danhMuc == null)
            {
                return BadRequest(new
                {
                    message = "Danh mục không tồn tại hoặc không thuộc nhà hàng này."
                });
            }

            var monAn = new Monan
            {
                MaNhaHang = nhaHang.MaNhaHang,
                MaDanhMuc = request.MaDanhMuc,
                TenMonAn = request.TenMonAn.Trim(),
                MoTa = string.IsNullOrWhiteSpace(request.MoTa)
                    ? null
                    : request.MoTa.Trim(),
                Gia = request.Gia,
                HinhAnh = string.IsNullOrWhiteSpace(request.HinhAnh)
                    ? null
                    : request.HinhAnh.Trim(),

                // Mặc định còn bán
                TrangThai = true,

                // Món mới chưa có đánh giá
                DanhGiaTrungBinh = 0
            };

            _context.Monans.Add(monAn);

            await _context.SaveChangesAsync();

            return Created(
                $"/api/mon-an/{monAn.MaMonAn}",
                new
                {
                    message = "Tạo món ăn thành công.",
                    maMonAn = monAn.MaMonAn
                });
        }

        // =========================================================
        // PUT /api/mon-an/{id}
        // QUÁN
        // =========================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateMonAn(
            int id,
            CapNhatMonAnRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TenMonAn))
            {
                return BadRequest(new
                {
                    message = "Tên món ăn không được để trống."
                });
            }

            if (request.Gia < 0)
            {
                return BadRequest(new
                {
                    message = "Giá món ăn không được âm."
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
                    x.MaTaiKhoan == maTaiKhoan.Value);

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            if (nhaHang.TrangThaiDuyet != "DaDuyet")
            {
                return BadRequest(new
                {
                    message = "Nhà hàng chưa được Admin duyệt."
                });
            }

            var monAn = await _context.Monans
                .FirstOrDefaultAsync(x =>
                    x.MaMonAn == id);

            if (monAn == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn."
                });
            }

            // Không cho Quán này sửa món của Quán khác
            if (monAn.MaNhaHang != nhaHang.MaNhaHang)
            {
                return Forbid();
            }

            // Kiểm tra danh mục mới thuộc đúng nhà hàng
            var danhMuc = await _context.Danhmucs
                .AnyAsync(x =>
                    x.MaDanhMuc == request.MaDanhMuc &&
                    x.MaNhaHang == nhaHang.MaNhaHang);

            if (!danhMuc)
            {
                return BadRequest(new
                {
                    message = "Danh mục không tồn tại hoặc không thuộc nhà hàng này."
                });
            }

            monAn.MaDanhMuc = request.MaDanhMuc;
            monAn.TenMonAn = request.TenMonAn.Trim();
            monAn.MoTa = string.IsNullOrWhiteSpace(request.MoTa)
                ? null
                : request.MoTa.Trim();
            monAn.Gia = request.Gia;
            monAn.HinhAnh = string.IsNullOrWhiteSpace(request.HinhAnh)
                ? null
                : request.HinhAnh.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật món ăn thành công."
            });
        }

        // =========================================================
        // PUT /api/mon-an/{id}/trang-thai
        // QUÁN
        // Bật / tắt món, KHÔNG xoá cứng
        // =========================================================

        [HttpPut("{id:int}/trang-thai")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateTrangThaiMonAn(
            int id,
            CapNhatTrangThaiMonAnRequest request)
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
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value);

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            if (nhaHang.TrangThaiDuyet != "DaDuyet")
            {
                return BadRequest(new
                {
                    message = "Nhà hàng chưa được Admin duyệt."
                });
            }

            var monAn = await _context.Monans
                .FirstOrDefaultAsync(x =>
                    x.MaMonAn == id);

            if (monAn == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn."
                });
            }

            if (monAn.MaNhaHang != nhaHang.MaNhaHang)
            {
                return Forbid();
            }

            monAn.TrangThai = request.TrangThai;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = request.TrangThai
                    ? "Đã bật bán món ăn."
                    : "Đã tắt bán món ăn.",
                trangThai = request.TrangThai
            });
        }

        // =========================================================
        // DELETE /api/mon-an/{id}
        // QUÁN
        //
        // Nếu món đã từng xuất hiện trong ChiTietDonHang:
        // KHÔNG được xoá cứng -> trả 409 và yêu cầu tắt món.
        //
        // Nếu chưa từng có trong đơn:
        // cho phép xoá.
        // =========================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> DeleteMonAn(int id)
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
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value);

            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhà hàng của tài khoản này."
                });
            }

            if (nhaHang.TrangThaiDuyet != "DaDuyet")
            {
                return BadRequest(new
                {
                    message = "Nhà hàng chưa được Admin duyệt."
                });
            }

            var monAn = await _context.Monans
                .Include(x => x.MaNhomToppings)
                .FirstOrDefaultAsync(x =>
                    x.MaMonAn == id);

            if (monAn == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn."
                });
            }

            if (monAn.MaNhaHang != nhaHang.MaNhaHang)
            {
                return Forbid();
            }

            // Kiểm tra món đã từng xuất hiện trong đơn hàng chưa
            var daCoTrongDonHang = await _context.Chitietdonhangs
                .AsNoTracking()
                .AnyAsync(x => x.MaMonAn == id);

            if (daCoTrongDonHang)
            {
                return Conflict(new
                {
                    message = "Món ăn đã từng xuất hiện trong đơn hàng nên không thể xoá. Hãy chuyển món sang trạng thái tắt bán."
                });
            }

            // Xoá các quan hệ Món ăn - Nhóm topping trước
            monAn.MaNhomToppings.Clear();

            // Xoá các chi tiết giỏ hàng đang tham chiếu món
            var chiTietGioHangs = await _context.Chitietgiohangs
                .Where(x => x.MaMonAn == id)
                .ToListAsync();

            if (chiTietGioHangs.Count > 0)
            {
                _context.Chitietgiohangs.RemoveRange(chiTietGioHangs);
            }

            // Cuối cùng xoá món
            _context.Monans.Remove(monAn);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xoá món ăn thành công."
            });
        }

        // =========================================================
        // LẤY MaTaiKhoan TỪ JWT
        // =========================================================

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(value, out var id)
                ? id
                : null;
        }
        // =========================================================
        // POST /api/mon-an/{maMonAn}/gan-topping
        // QUÁN
        // =========================================================

        [HttpPost("{maMonAn:int}/gan-topping")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> GanNhomTopping(
            int maMonAn,
            [FromBody] int maNhomTopping)
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
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value);


            if (nhaHang == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhà hàng."
                });
            }


            var monAn = await _context.Monans
                .Include(x => x.MaNhomToppings)
                .FirstOrDefaultAsync(x =>
                    x.MaMonAn == maMonAn);


            if (monAn == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn."
                });
            }


            if (monAn.MaNhaHang != nhaHang.MaNhaHang)
            {
                return Forbid();
            }


            var nhomTopping = await _context.Nhomtoppings
                .FirstOrDefaultAsync(x =>
                    x.MaNhomTopping == maNhomTopping &&
                    x.MaNhaHang == nhaHang.MaNhaHang);


            if (nhomTopping == null)
            {
                return BadRequest(new
                {
                    message = "Nhóm topping không tồn tại hoặc không thuộc nhà hàng."
                });
            }


            if (monAn.MaNhomToppings
                .Any(x => x.MaNhomTopping == maNhomTopping))
            {
                return BadRequest(new
                {
                    message = "Món ăn đã có nhóm topping này."
                });
            }


            monAn.MaNhomToppings.Add(nhomTopping);

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message = "Gán nhóm topping cho món ăn thành công."
            });
        }

        // =========================================================
        // DELETE /api/mon-an/{maMonAn}/go-topping/{maNhomTopping}
        // QUÁN
        // =========================================================

        [HttpDelete("{maMonAn:int}/go-topping/{maNhomTopping:int}")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> GoNhomTopping(
            int maMonAn,
            int maNhomTopping)
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
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value);


            if (nhaHang == null)
            {
                return NotFound();
            }


            var monAn = await _context.Monans
                .Include(x => x.MaNhomToppings)
                .FirstOrDefaultAsync(x =>
                    x.MaMonAn == maMonAn);


            if (monAn == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn."
                });
            }


            if (monAn.MaNhaHang != nhaHang.MaNhaHang)
            {
                return Forbid();
            }


            var nhom = monAn.MaNhomToppings
                .FirstOrDefault(x =>
                    x.MaNhomTopping == maNhomTopping);


            if (nhom == null)
            {
                return BadRequest(new
                {
                    message = "Món ăn chưa có nhóm topping này."
                });
            }


            monAn.MaNhomToppings.Remove(nhom);

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message = "Gỡ nhóm topping khỏi món ăn thành công."
            });
        }

    }
}