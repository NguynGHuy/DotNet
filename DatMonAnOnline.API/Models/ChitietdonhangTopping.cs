using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class ChitietdonhangTopping
{
    public int MaChiTietDonHang { get; set; }

    public int MaTopping { get; set; }

    public int SoLuong { get; set; }

    public decimal GiaThemLucDat { get; set; }

    public virtual Chitietdonhang MaChiTietDonHangNavigation { get; set; } = null!;

    public virtual Topping MaToppingNavigation { get; set; } = null!;
}
