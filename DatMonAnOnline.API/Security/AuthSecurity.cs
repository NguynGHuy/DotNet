using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Text;

namespace DatMonAnOnline.API.Security;

public static class AuthRateLimitPolicies
{
    public const string Login = "auth-login";
    public const string RequestPasswordReset = "auth-password-reset-request";
    public const string ConfirmPasswordReset = "auth-password-reset-confirm";
}

public static class PasswordTokenVersion
{
    public const string ClaimType = "pwd_ver";

    public static string Create(string storedPasswordHash)
    {
        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(storedPasswordHash));
        return Base64UrlEncoder.Encode(digest);
    }

    public static bool Matches(string? tokenVersion, string storedPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(tokenVersion))
            return false;

        var expected = Encoding.ASCII.GetBytes(Create(storedPasswordHash));
        var actual = Encoding.ASCII.GetBytes(tokenVersion);

        return actual.Length == expected.Length &&
               CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
