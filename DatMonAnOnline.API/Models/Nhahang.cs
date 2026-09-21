using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Nhahang
{
    public int MaNhaHang { get; set; }

    public int MaTaiKhoan { get; set; }

    public string TenNhaHang { get; set; } = null!;

    public string? MoTa { get; set; }

    public string DiaChiQuan { get; set; } = null!;

    public string? AnhBia { get; set; }

    public TimeOnly? GioMoCua { get; set; }

    public TimeOnly? GioDongCua { get; set; }

    public string TrangThaiDuyet { get; set; } = null!;

    public string TrangThaiHoatDong { get; set; } = null!;

    public float DanhGiaTrungBinh { get; set; }

    public decimal PhiShipMacDinh { get; set; }

    public virtual ICollection<Danhgianhahang> Danhgianhahangs { get; set; } = new List<Danhgianhahang>();

    public virtual ICollection<Danhmuc> Danhmucs { get; set; } = new List<Danhmuc>();

    public virtual ICollection<Donhang> Donhangs { get; set; } = new List<Donhang>();

    public virtual ICollection<Khuyenmai> Khuyenmais { get; set; } = new List<Khuyenmai>();

    public virtual Taikhoan MaTaiKhoanNavigation { get; set; } = null!;

    public virtual ICollection<Monan> Monans { get; set; } = new List<Monan>();

    public virtual ICollection<Nhomtopping> Nhomtoppings { get; set; } = new List<Nhomtopping>();
}
