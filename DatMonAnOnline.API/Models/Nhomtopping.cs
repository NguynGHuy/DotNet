using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Nhomtopping
{
    public int MaNhomTopping { get; set; }

    public int MaNhaHang { get; set; }

    public string TenNhom { get; set; } = null!;

    public bool BatBuocChon { get; set; }

    public int? ChonToiDa { get; set; }

    public virtual Nhahang MaNhaHangNavigation { get; set; } = null!;

    public virtual ICollection<Topping> Toppings { get; set; } = new List<Topping>();

    public virtual ICollection<Monan> MaMonAns { get; set; } = new List<Monan>();
}
