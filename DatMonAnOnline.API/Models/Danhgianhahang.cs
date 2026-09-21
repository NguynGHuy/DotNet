using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Danhgianhahang
{
    public int MaDanhGia { get; set; }

    public int MaKhachHang { get; set; }

    public int MaNhaHang { get; set; }

    public int MaDonHang { get; set; }

    public sbyte SoSao { get; set; }

    public string? NoiDung { get; set; }

    public DateTime NgayDanhGia { get; set; }

    public virtual Donhang MaDonHangNavigation { get; set; } = null!;

    public virtual Khachhang MaKhachHangNavigation { get; set; } = null!;

    public virtual Nhahang MaNhaHangNavigation { get; set; } = null!;
}
