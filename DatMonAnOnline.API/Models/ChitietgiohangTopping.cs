using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class ChitietgiohangTopping
{
    public int MaChiTietGioHang { get; set; }

    public int MaTopping { get; set; }

    public int SoLuong { get; set; }

    public decimal GiaThem { get; set; }

    public virtual Chitietgiohang MaChiTietGioHangNavigation { get; set; } = null!;

    public virtual Topping MaToppingNavigation { get; set; } = null!;
}
