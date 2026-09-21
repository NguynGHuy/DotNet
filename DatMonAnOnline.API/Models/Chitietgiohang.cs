using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Chitietgiohang
{
    public int MaChiTietGioHang { get; set; }

    public int MaGioHang { get; set; }

    public int MaMonAn { get; set; }

    public int SoLuong { get; set; }

    public string? GhiChu { get; set; }

    public virtual ICollection<ChitietgiohangTopping> ChitietgiohangToppings { get; set; } = new List<ChitietgiohangTopping>();

    public virtual Giohang MaGioHangNavigation { get; set; } = null!;

    public virtual Monan MaMonAnNavigation { get; set; } = null!;
}
