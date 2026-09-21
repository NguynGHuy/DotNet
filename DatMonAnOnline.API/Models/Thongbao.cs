using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Thongbao
{
    public int MaThongBao { get; set; }

    public int MaTaiKhoan { get; set; }

    public string TieuDe { get; set; } = null!;

    public string NoiDung { get; set; } = null!;

    public string? Loai { get; set; }

    public bool DaDoc { get; set; }

    public DateTime NgayTao { get; set; }

    public virtual Taikhoan MaTaiKhoanNavigation { get; set; } = null!;
}
