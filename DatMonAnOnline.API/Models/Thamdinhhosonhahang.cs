namespace DatMonAnOnline.API.Models;

public partial class Thamdinhhosonhahang
{
    public int MaThamDinh { get; set; }

    public int MaHopDong { get; set; }

    public int MaTaiKhoanAdmin { get; set; }

    public string KetQuaGiayPhep { get; set; } = null!;

    public string KetQuaGiayToDaiDien { get; set; } = null!;

    public string KetQuaHopDong { get; set; } = null!;

    public string KetQua { get; set; } = null!;

    public string? GhiChu { get; set; }

    public DateTime ThoiGian { get; set; }
}
