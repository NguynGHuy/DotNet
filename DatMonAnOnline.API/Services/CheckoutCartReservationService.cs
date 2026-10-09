using Microsoft.Extensions.Caching.Memory;

namespace DatMonAnOnline.API.Services;

public interface ICheckoutCartReservationService
{
    DateTime Reserve(int cartId);
    bool IsReserved(int cartId);
    void Release(int cartId);
}

public sealed class CheckoutCartReservationService : ICheckoutCartReservationService
{
    private static readonly TimeSpan ReservationLifetime = TimeSpan.FromMinutes(30);
    private readonly IMemoryCache _cache;

    public CheckoutCartReservationService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public DateTime Reserve(int cartId)
    {
        var expiresAtUtc = DateTime.UtcNow.Add(ReservationLifetime);
        _cache.Set(GetKey(cartId), true, new DateTimeOffset(expiresAtUtc));
        return expiresAtUtc;
    }

    public bool IsReserved(int cartId)
        => _cache.TryGetValue(GetKey(cartId), out _);

    public void Release(int cartId)
        => _cache.Remove(GetKey(cartId));

    private static string GetKey(int cartId) => $"checkout-cart:{cartId}";
}
