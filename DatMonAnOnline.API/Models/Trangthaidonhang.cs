using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Trangthaidonhang
{
    public int MaTrangThai { get; set; }

    public string TenTrangThai { get; set; } = null!;

    public int? ThuTu { get; set; }

    public virtual ICollection<Donhang> Donhangs { get; set; } = new List<Donhang>();

    public virtual ICollection<Lichsutrangthaidonhang> Lichsutrangthaidonhangs { get; set; } = new List<Lichsutrangthaidonhang>();
}
