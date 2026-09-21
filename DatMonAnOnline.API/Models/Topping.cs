using System;
using System.Collections.Generic;

namespace DatMonAnOnline.API.Models;

public partial class Topping
{
    public int MaTopping { get; set; }

    public int MaNhomTopping { get; set; }

    public string TenTopping { get; set; } = null!;

    public decimal GiaThem { get; set; }

    public bool? TrangThai { get; set; }

    public virtual ICollection<ChitietdonhangTopping> ChitietdonhangToppings { get; set; } = new List<ChitietdonhangTopping>();

    public virtual ICollection<ChitietgiohangTopping> ChitietgiohangToppings { get; set; } = new List<ChitietgiohangTopping>();

    public virtual Nhomtopping MaNhomToppingNavigation { get; set; } = null!;
}
