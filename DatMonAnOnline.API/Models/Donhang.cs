using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Donhang
{
    public int MaDonHang { get; set; }

    public string MaDonHangHienThi { get; set; } = null!;

    public int MaKhachHang { get; set; }

    public int MaNhaHang { get; set; }

    public int? MaDiaChi { get; set; }

    public int MaTrangThai { get; set; }

    public int? MaKhuyenMai { get; set; }

    public DateTime ThoiGianDat { get; set; }

    public DateTime? ThoiGianGiaoDuKien { get; set; }

    public DateTime? ThoiGianGiaoThucTe { get; set; }

    public string TenNguoiNhan { get; set; } = null!;

    public string SoDienThoaiNhan { get; set; } = null!;

    public string DiaChiGiaoHang { get; set; } = null!;

    public decimal TongTienHang { get; set; }

    public decimal PhiShip { get; set; }

    public decimal SoTienGiam { get; set; }

    public decimal ThanhTien { get; set; }

    public string? GhiChu { get; set; }

    public string? LyDoHuy { get; set; }

    public virtual ICollection<Chitietdonhang> Chitietdonhangs { get; set; } = new List<Chitietdonhang>();

    public virtual ICollection<Danhgiamonan> Danhgiamonans { get; set; } = new List<Danhgiamonan>();

    public virtual ICollection<Danhgianhahang> Danhgianhahangs { get; set; } = new List<Danhgianhahang>();

    public virtual ICollection<Lichsutrangthaidonhang> Lichsutrangthaidonhangs { get; set; } = new List<Lichsutrangthaidonhang>();

    public virtual Diachi? MaDiaChiNavigation { get; set; }

    public virtual Khachhang MaKhachHangNavigation { get; set; } = null!;

    public virtual Khuyenmai? MaKhuyenMaiNavigation { get; set; }

    public virtual Nhahang MaNhaHangNavigation { get; set; } = null!;

    public virtual Trangthaidonhang MaTrangThaiNavigation { get; set; } = null!;

    public virtual ICollection<Thanhtoan> Thanhtoans { get; set; } = new List<Thanhtoan>();
}
