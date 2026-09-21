using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Diachi
{
    public int MaDiaChi { get; set; }

    public int MaKhachHang { get; set; }

    public string TenNguoiNhan { get; set; } = null!;

    public string SoDienThoaiNhan { get; set; } = null!;

    public string DiaChiCuThe { get; set; } = null!;

    public string? GhiChu { get; set; }

    public bool MacDinh { get; set; }

    public virtual ICollection<Donhang> Donhangs { get; set; } = new List<Donhang>();

    public virtual Khachhang MaKhachHangNavigation { get; set; } = null!;
}
