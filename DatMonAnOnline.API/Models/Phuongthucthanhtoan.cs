using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Phuongthucthanhtoan
{
    public int MaPhuongThuc { get; set; }

    public string TenPhuongThuc { get; set; } = null!;

    public bool? TrangThai { get; set; }

    public virtual ICollection<Thanhtoan> Thanhtoans { get; set; } = new List<Thanhtoan>();
}
