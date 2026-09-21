using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Role
{
    public int MaRole { get; set; }

    public string TenRole { get; set; } = null!;

    public string? MoTa { get; set; }

    public virtual ICollection<Taikhoan> Taikhoans { get; set; } = new List<Taikhoan>();
}
