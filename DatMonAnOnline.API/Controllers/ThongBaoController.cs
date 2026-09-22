using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DatMonAnOnline.API.Models;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [ApiController]
    [Route("api/thong-bao")]
    [Authorize]
    public class ThongBaoController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public ThongBaoController(DatMonAnOnlineContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        //private int GetCurrentUserId() {
        //    return 4;        
        //}

        [HttpGet]
        public async Task<IActionResult> LayDanhSachThongBao()
        {
            var list = await _context.Thongbaos
                .Where(x => x.MaTaiKhoan == GetCurrentUserId())
                .OrderByDescending(x => x.NgayTao)
                .ToListAsync();
            return Ok(list);
        }

        [HttpPut("{id}/da-doc")]
        public async Task<IActionResult> DanhDauDaDoc(int id)
        {
            var tb = await _context.Thongbaos.FirstOrDefaultAsync(x => x.MaThongBao == id && x.MaTaiKhoan == GetCurrentUserId());
            if (tb == null) return NotFound();

            tb.DaDoc = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã đánh dấu đọc" });
        }

        [HttpPut("danh-dau-tat-ca")]
        public async Task<IActionResult> DanhDauTatCaDaDoc()
        {
            var list = await _context.Thongbaos
                .Where(x => x.MaTaiKhoan == GetCurrentUserId() && !x.DaDoc)
                .ToListAsync();

            foreach (var tb in list)
            {
                tb.DaDoc = true;
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã đánh dấu đọc tất cả" });
        }
    }
}