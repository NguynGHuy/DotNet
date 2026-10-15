namespace DatMonAnOnline.API.Options;

public sealed class DoiSoatOptions
{
    public const string SectionName = "DoiSoat";

    // Chỉ các đơn được tạo từ thời điểm này mới có snapshot tài chính
    // theo công thức đối soát hiện hành.
    public DateTime BatDauApDung { get; set; }
}
