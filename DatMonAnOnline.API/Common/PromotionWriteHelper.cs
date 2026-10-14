using DatMonAnOnline.API.Models;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace DatMonAnOnline.API.Common;

// Khuyến mãi - chuẩn hóa trước khi lưu
public static class PromotionWriteHelper
{
    public static void Normalize(PromotionCreateRequest request)
    {
        request.MaCode = request.MaCode.Trim().ToUpperInvariant();
        request.MoTa = string.IsNullOrWhiteSpace(request.MoTa)
            ? null
            : request.MoTa.Trim();

        if (request.LoaiGiam == "SoTien")
        {
            request.GiamToiDa = request.GiaTriGiam;
        }
    }

    // Unique constraint trong database bảo vệ cả request đồng thời.
    public static async Task<bool> SaveNewAsync(
        DatMonAnOnlineContext context)
    {
        try
        {
            await context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is MySqlException { Number: 1062 })
        {
            return false;
        }
    }
}