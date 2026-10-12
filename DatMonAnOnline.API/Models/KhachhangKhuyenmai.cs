namespace DatMonAnOnline.API.Models;

public partial class KhachhangKhuyenmai
{
    public int MaKhachHang { get; set; }

    public int MaKhuyenMai { get; set; }

    public DateTime NgayLuu { get; set; }

    public virtual Khachhang MaKhachHangNavigation { get; set; } = null!;

    public virtual Khuyenmai MaKhuyenMaiNavigation { get; set; } = null!;
}
