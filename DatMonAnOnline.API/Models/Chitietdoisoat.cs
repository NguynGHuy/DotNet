using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Chitietdoisoat
{
    public int MaChiTietDoiSoat { get; set; }

    public int MaDoiSoat { get; set; }

    public int MaDonHang { get; set; }

    public int MaNhaHang { get; set; }

    public decimal TongTienHang { get; set; }

    public decimal GiamGiaNhaHang { get; set; }

    public decimal GiamGiaHeThong { get; set; }

    public decimal PhiShip { get; set; }

    public decimal TyLePhiNenTang { get; set; }

    public decimal PhiNenTang { get; set; }

    public decimal SoTienHoan { get; set; }

    public decimal SoTienNhaHangNhan { get; set; }

    public decimal TienNhaHangDaThu { get; set; }

    public decimal? SoTienCanDoiSoat { get; set; }

    public DateTime NgayThem { get; set; }

    public virtual Doisoatnhahang Doisoatnhahang { get; set; } = null!;

    public virtual Donhang Donhang { get; set; } = null!;
}
