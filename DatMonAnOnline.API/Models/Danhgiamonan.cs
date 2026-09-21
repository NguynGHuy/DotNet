using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Danhgiamonan
{
    public int MaDanhGia { get; set; }

    public int MaKhachHang { get; set; }

    public int MaMonAn { get; set; }

    public int MaDonHang { get; set; }

    public sbyte SoSao { get; set; }

    public string? NoiDung { get; set; }

    public string? HinhAnh { get; set; }

    public DateTime NgayDanhGia { get; set; }

    public virtual Donhang MaDonHangNavigation { get; set; } = null!;

    public virtual Khachhang MaKhachHangNavigation { get; set; } = null!;

    public virtual Monan MaMonAnNavigation { get; set; } = null!;
}
