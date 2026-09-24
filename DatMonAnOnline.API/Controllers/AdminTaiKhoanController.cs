using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/admin/tai-khoan")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminTaiKhoanController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public AdminTaiKhoanController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDanhSachTaiKhoan([FromQuery] string? role = null, [FromQuery] bool? trangThai = null)
        {
            var query = _context.Taikhoans
                .AsNoTracking()
                .Include(x => x.MaRoleNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(role))
                query = query.Where(x => x.MaRoleNavigation.TenRole == role.Trim());

            if (trangThai.HasValue)
                query = query.Where(x => x.TrangThai == trangThai.Value);

            var result = await query
                .OrderByDescending(x => x.MaTaiKhoan)
                .Select(x => new
                {
                    x.MaTaiKhoan,
                    x.Email,
                    x.SoDienThoai,
                    role = x.MaRoleNavigation.TenRole,
                    x.TrangThai,
                    x.DaXacThucEmail,
                    x.NgayTao,
                    x.AnhDaiDien
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpPut("{id:int}/khoa")]
        public async Task<IActionResult> KhoaTaiKhoan(int id)
        {
            var currentId = GetMaTaiKhoan();
            if (currentId == id)
                return BadRequest(new { message = "Không thể tự khóa tài khoản Admin đang đăng nhập." });

            var taiKhoan = await _context.Taikhoans.FirstOrDefaultAsync(x => x.MaTaiKhoan == id);
            if (taiKhoan == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            if (taiKhoan.TrangThai != true )
                return Conflict(new { message = "Tài khoản đã bị khóa." });

            taiKhoan.TrangThai = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Khóa tài khoản thành công." });
        }

        [HttpPut("{id:int}/mo-khoa")]
        public async Task<IActionResult> MoKhoaTaiKhoan(int id)
        {
            var taiKhoan = await _context.Taikhoans.FirstOrDefaultAsync(x => x.MaTaiKhoan == id);
            if (taiKhoan == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            if (taiKhoan.TrangThai == true)
                return Conflict(new { message = "Tài khoản đang hoạt động." });

            taiKhoan.TrangThai = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mở khóa tài khoản thành công." });
        }

        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
