using Microsoft.EntityFrameworkCore;

namespace DatMonAnOnline.API.Common;

public static class QueryablePaginationExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        PaginationQuery pagination,
        CancellationToken cancellationToken = default)
    {
        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pagination.PageSize);

        var pageNumber = totalPages == 0
            ? 1
            : Math.Min(pagination.PageNumber, totalPages);

        var items = await query
            .Skip((pageNumber - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pagination.PageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }
}
