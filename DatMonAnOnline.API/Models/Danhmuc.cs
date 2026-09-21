using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Danhmuc
{
    public int MaDanhMuc { get; set; }

    public int MaNhaHang { get; set; }

    public string TenDanhMuc { get; set; } = null!;

    public int? ThuTuHienThi { get; set; }

    public virtual Nhahang MaNhaHangNavigation { get; set; } = null!;

    public virtual ICollection<Monan> Monans { get; set; } = new List<Monan>();
}
