using System.ComponentModel.DataAnnotations;

namespace DatMonAnOnline.API.Common;

public sealed class PaginationQuery
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 12;
}
