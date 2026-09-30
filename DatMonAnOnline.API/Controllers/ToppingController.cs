using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DatMonAnOnline.API.Controllers
{
    [Route("api/topping")]
    [ApiController]
    public class ToppingController : ControllerBase
    {
        private readonly DatMonAnOnlineContext _context;

        public ToppingController(DatMonAnOnlineContext context)
        {
            _context = context;
        }


        // =========================
        // REQUEST
        // =========================

        public class TaoToppingRequest
        {
            [Required]
            public int MaNhomTopping { get; set; }

            [Required]
            public string TenTopping { get; set; } = string.Empty;

            [Range(0, double.MaxValue)]
            public decimal GiaThem { get; set; }
        }


        public class CapNhatToppingRequest
        {
            [Required]
            public string TenTopping { get; set; } = string.Empty;

            [Range(0, double.MaxValue)]
            public decimal GiaThem { get; set; }
        }


        public class CapNhatTrangThaiRequest
        {
            public bool TrangThai { get; set; }
        }



        // =========================
        // GET
        // GET /api/topping?maNhomTopping=id
        // =========================

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetTopping(
            [FromQuery] int maNhomTopping)
        {
            if (maNhomTopping <= 0)
            {
                return BadRequest(new
                {
                    message = "Mã nhóm topping không hợp lệ."
                });
            }


            var data = await _context.Toppings
                .AsNoTracking()
                .Where(x => x.MaNhomTopping == maNhomTopping)
                .Select(x => new
                {
                    x.MaTopping,
                    x.MaNhomTopping,
                    x.TenTopping,
                    x.GiaThem,
                    x.TrangThai
                })
                .ToListAsync();


            return Ok(data);
        }



        // =========================
        // POST
        // POST /api/topping
        // =========================

        [HttpPost]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> CreateTopping(
            TaoToppingRequest request)
        {

            var maTaiKhoan = GetMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Token không hợp lệ."
                });
            }


            var nhom = await _context.Nhomtoppings
                .Include(x => x.MaNhaHangNavigation)
                .FirstOrDefaultAsync(x =>
                    x.MaNhomTopping == request.MaNhomTopping);


            if (nhom == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy nhóm topping."
                });
            }


            if (nhom.MaNhaHangNavigation.MaTaiKhoan != maTaiKhoan)
            {
                return Forbid();
            }



            var topping = new Topping
            {
                MaNhomTopping = request.MaNhomTopping,
                TenTopping = request.TenTopping.Trim(),
                GiaThem = request.GiaThem,
                TrangThai = true
            };


            _context.Toppings.Add(topping);

            await _context.SaveChangesAsync();


            return Created("", new
            {
                message = "Tạo topping thành công.",
                maTopping = topping.MaTopping
            });
        }



        // =========================
        // PUT
        // PUT /api/topping/{id}
        // =========================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateTopping(
            int id,
            CapNhatToppingRequest request)
        {

            var topping = await _context.Toppings
                .Include(x => x.MaNhomToppingNavigation)
                .ThenInclude(x => x.MaNhaHangNavigation)
                .FirstOrDefaultAsync(x =>
                    x.MaTopping == id);


            if (topping == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy topping."
                });
            }


            var maTaiKhoan = GetMaTaiKhoan();


            if (topping.MaNhomToppingNavigation
                .MaNhaHangNavigation.MaTaiKhoan != maTaiKhoan)
            {
                return Forbid();
            }



            topping.TenTopping = request.TenTopping.Trim();
            topping.GiaThem = request.GiaThem;


            await _context.SaveChangesAsync();


            return Ok(new
            {
                message = "Cập nhật topping thành công."
            });
        }



        // =========================
        // PUT TRẠNG THÁI
        // PUT /api/topping/{id}/trang-thai
        // =========================

        [HttpPut("{id:int}/trang-thai")]
        [Authorize(Roles = "Quan")]
        public async Task<IActionResult> UpdateTrangThai(
            int id,
            CapNhatTrangThaiRequest request)
        {

            var topping = await _context.Toppings
                .FirstOrDefaultAsync(x =>
                    x.MaTopping == id);


            if (topping == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy topping."
                });
            }


            topping.TrangThai = request.TrangThai;


            await _context.SaveChangesAsync();


            return Ok(new
            {
                message = "Cập nhật trạng thái topping thành công."
            });
        }



        private int? GetMaTaiKhoan()
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(value, out int id)
                ? id
                : null;
        }
    }
}