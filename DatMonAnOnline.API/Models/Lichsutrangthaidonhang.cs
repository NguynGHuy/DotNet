using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Lichsutrangthaidonhang
{
    public int MaLichSu { get; set; }

    public int MaDonHang { get; set; }

    public int MaTrangThai { get; set; }

    public int MaTaiKhoan { get; set; }

    public DateTime ThoiGianTao { get; set; }

    public string? GhiChu { get; set; }

    public virtual Donhang MaDonHangNavigation { get; set; } = null!;

    public virtual Taikhoan MaTaiKhoanNavigation { get; set; } = null!;

    public virtual Trangthaidonhang MaTrangThaiNavigation { get; set; } = null!;
}
