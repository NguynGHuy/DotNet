using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Monan
{
    public int MaMonAn { get; set; }

    public int MaNhaHang { get; set; }

    public int MaDanhMuc { get; set; }

    public string TenMonAn { get; set; } = null!;

    public string? MoTa { get; set; }

    public decimal Gia { get; set; }

    public string? HinhAnh { get; set; }

    public bool? TrangThai { get; set; }

    public float DanhGiaTrungBinh { get; set; }

    public virtual ICollection<Chitietdonhang> Chitietdonhangs { get; set; } = new List<Chitietdonhang>();

    public virtual ICollection<Chitietgiohang> Chitietgiohangs { get; set; } = new List<Chitietgiohang>();

    public virtual ICollection<Danhgiamonan> Danhgiamonans { get; set; } = new List<Danhgiamonan>();

    public virtual Danhmuc MaDanhMucNavigation { get; set; } = null!;

    public virtual Nhahang MaNhaHangNavigation { get; set; } = null!;

    public virtual ICollection<Nhomtopping> MaNhomToppings { get; set; } = new List<Nhomtopping>();
}
