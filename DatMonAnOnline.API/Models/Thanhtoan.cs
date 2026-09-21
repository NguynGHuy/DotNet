using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Thanhtoan
{
    public int MaThanhToan { get; set; }

    public int MaDonHang { get; set; }

    public int MaPhuongThuc { get; set; }

    public decimal SoTien { get; set; }

    public string TrangThaiThanhToan { get; set; } = null!;

    public string? MaGiaoDich { get; set; }

    public DateTime? ThoiGianThanhToan { get; set; }

    public virtual Donhang MaDonHangNavigation { get; set; } = null!;

    public virtual Phuongthucthanhtoan MaPhuongThucNavigation { get; set; } = null!;
}
