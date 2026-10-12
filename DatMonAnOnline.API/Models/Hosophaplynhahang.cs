namespace DatMonAnOnline.API.Models;

public partial class Hosophaplynhahang
{
    public int MaNhaHang { get; set; }

    public string? NguoiDaiDien { get; set; }

    public string? ChucVuNguoiDaiDien { get; set; }

    public string? SoGiayToNguoiDaiDien { get; set; }

    public string? TenPhapLy { get; set; }

    public string? MaSoThue { get; set; }

    public string? DiaChiPhapLy { get; set; }

    public string? SoGiayPhepKinhDoanh { get; set; }

    public string? FileGiayPhepKinhDoanh { get; set; }

    public string? FileGiayToNguoiDaiDien { get; set; }

    public DateTime NgayTao { get; set; }

    public DateTime NgayCapNhat { get; set; }

    public virtual Nhahang MaNhaHangNavigation { get; set; } = null!;
}