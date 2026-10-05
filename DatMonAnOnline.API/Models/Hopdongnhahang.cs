using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Hopdongnhahang
{
    public int MaHopDong { get; set; }

    public int MaNhaHang { get; set; }

    public string SoHopDong { get; set; } = null!;

    public string NguoiDaiDien { get; set; } = null!;

    public string? ChucVuNguoiDaiDien { get; set; }

    public string? SoGiayToNguoiDaiDien { get; set; }

    public string? MaSoThue { get; set; }

    public string? SoGiayPhepKinhDoanh { get; set; }

    public string? FileGiayPhepKinhDoanh { get; set; }

    public string? FileGiayToNguoiDaiDien { get; set; }

    public string? FileHopDong { get; set; }

    public string PhienBanDieuKhoan { get; set; } = null!;

    public decimal TyLePhiNenTang { get; set; }

    public DateOnly NgayBatDau { get; set; }

    public DateOnly NgayKetThuc { get; set; }

    public DateTime? ThoiGianKy { get; set; }

    public string TrangThai { get; set; } = null!;

    public int? MaTaiKhoanDuyet { get; set; }

    public DateTime? ThoiGianDuyet { get; set; }

    public string? LyDoTuChoi { get; set; }

    public string? LyDoChamDut { get; set; }

    public DateTime NgayTao { get; set; }

    public DateTime NgayCapNhat { get; set; }

    public virtual ICollection<Donhang> Donhangs { get; set; } = new List<Donhang>();

    public virtual Nhahang MaNhaHangNavigation { get; set; } = null!;

    public virtual Taikhoan? MaTaiKhoanDuyetNavigation { get; set; }
}
