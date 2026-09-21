using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Chitietdonhang
{
    public int MaChiTietDonHang { get; set; }

    public int MaDonHang { get; set; }

    public int MaMonAn { get; set; }

    public int SoLuong { get; set; }

    public decimal DonGia { get; set; }

    public decimal ThanhTien { get; set; }

    public string? GhiChu { get; set; }

    public virtual ICollection<ChitietdonhangTopping> ChitietdonhangToppings { get; set; } = new List<ChitietdonhangTopping>();

    public virtual Donhang MaDonHangNavigation { get; set; } = null!;

    public virtual Monan MaMonAnNavigation { get; set; } = null!;
}
