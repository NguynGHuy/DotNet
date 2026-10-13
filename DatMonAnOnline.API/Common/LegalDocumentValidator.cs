using System.Buffers.Binary;
using System.Text;

namespace DatMonAnOnline.API.Common;

public static class LegalDocumentValidator
{
    private const int MaxImageDimension = 10_000;
    private const long MaxImagePixels = 40_000_000;

    private static readonly string[] DangerousPdfTokens =
    {
        "/JavaScript",
        "/JS",
        "/Launch",
        "/EmbeddedFile",
        "/OpenAction",
        "/AA"
    };

    public static bool HasExpectedContentType(
        string extension,
        string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType) ||
            contentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return extension switch
        {
            ".pdf" => contentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase),
            ".jpg" or ".jpeg" => contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase),
            ".png" => contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    public static bool TryValidate(
        ReadOnlySpan<byte> data,
        string extension,
        out string error)
    {
        error = "";

        var valid = extension switch
        {
            ".pdf" => TryValidatePdf(data, out error),
            ".jpg" or ".jpeg" => TryValidateJpeg(data, out error),
            ".png" => TryValidatePng(data, out error),
            _ => false
        };

        if (!valid && string.IsNullOrWhiteSpace(error))
            error = "Định dạng tệp không được hỗ trợ.";

        return valid;
    }

    private static bool TryValidatePdf(
        ReadOnlySpan<byte> data,
        out string error)
    {
        error = "";

        if (data.Length < 16 || !data[..5].SequenceEqual("%PDF-"u8))
        {
            error = "Tệp PDF không có cấu trúc hợp lệ.";
            return false;
        }

        var tailLength = Math.Min(data.Length, 4096);
        var tail = Encoding.ASCII.GetString(data[^tailLength..]);

        if (!tail.Contains("%%EOF", StringComparison.Ordinal))
        {
            error = "Tệp PDF bị thiếu phần kết thúc hoặc đã bị hỏng.";
            return false;
        }

        var text = Encoding.ASCII.GetString(data);

        if (DangerousPdfTokens.Any(token => ContainsPdfName(text, token)))
        {
            error = "Tệp PDF chứa nội dung chủ động không được phép.";
            return false;
        }

        return true;
    }

    private static bool ContainsPdfName(string content, string name)
    {
        var start = 0;

        while (start < content.Length)
        {
            var index = content.IndexOf(
                name,
                start,
                StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            var end = index + name.Length;
            if (end == content.Length || IsPdfDelimiter(content[end]))
                return true;

            start = end;
        }

        return false;
    }

    private static bool IsPdfDelimiter(char value)
        => char.IsWhiteSpace(value) || value is '(' or ')' or '<' or '>' or
            '[' or ']' or '{' or '}' or '/' or '%';

    private static bool TryValidatePng(
        ReadOnlySpan<byte> data,
        out string error)
    {
        error = "";
        ReadOnlySpan<byte> signature = stackalloc byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
        };

        if (data.Length < 33 || !data[..8].SequenceEqual(signature))
        {
            error = "Tệp PNG không có cấu trúc hợp lệ.";
            return false;
        }

        var offset = 8;
        var foundHeader = false;
        var foundEnd = false;

        while (offset + 12 <= data.Length)
        {
            var chunkLength = BinaryPrimitives.ReadUInt32BigEndian(data.Slice(offset, 4));
            if (chunkLength > int.MaxValue || offset + 12L + chunkLength > data.Length)
            {
                error = "Tệp PNG bị hỏng.";
                return false;
            }

            var type = data.Slice(offset + 4, 4);

            if (!foundHeader)
            {
                if (!type.SequenceEqual("IHDR"u8) || chunkLength != 13)
                {
                    error = "Tệp PNG thiếu thông tin ảnh.";
                    return false;
                }

                var width = BinaryPrimitives.ReadUInt32BigEndian(data.Slice(offset + 8, 4));
                var height = BinaryPrimitives.ReadUInt32BigEndian(data.Slice(offset + 12, 4));

                if (!DimensionsAreSafe(width, height))
                {
                    error = "Kích thước ảnh quá lớn hoặc không hợp lệ.";
                    return false;
                }

                foundHeader = true;
            }

            if (type.SequenceEqual("IEND"u8))
            {
                if (chunkLength != 0 || offset + 12 != data.Length)
                {
                    error = "Tệp PNG có phần kết thúc hoặc dữ liệu đính kèm không hợp lệ.";
                    return false;
                }

                foundEnd = true;
                break;
            }

            offset += checked((int)chunkLength + 12);
        }

        if (!foundHeader || !foundEnd)
        {
            error = "Tệp PNG chưa hoàn chỉnh hoặc đã bị hỏng.";
            return false;
        }

        return true;
    }

    private static bool TryValidateJpeg(
        ReadOnlySpan<byte> data,
        out string error)
    {
        error = "";

        if (data.Length < 12 || data[0] != 0xFF || data[1] != 0xD8 ||
            data[^2] != 0xFF || data[^1] != 0xD9)
        {
            error = "Tệp JPEG không có cấu trúc hợp lệ.";
            return false;
        }

        var offset = 2;
        var foundFrame = false;

        while (offset + 1 < data.Length)
        {
            if (data[offset] != 0xFF)
            {
                offset++;
                continue;
            }

            while (offset < data.Length && data[offset] == 0xFF)
                offset++;

            if (offset >= data.Length)
                break;

            var marker = data[offset++];

            if (marker == 0xD9)
                break;

            if (marker == 0xDA)
                return foundFrame;

            if (marker is 0x01 or >= 0xD0 and <= 0xD7)
                continue;

            if (offset + 2 > data.Length)
                break;

            var segmentLength = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset, 2));
            if (segmentLength < 2 || offset + segmentLength > data.Length)
                break;

            if (IsStartOfFrame(marker))
            {
                if (segmentLength < 7)
                    break;

                var height = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset + 3, 2));
                var width = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(offset + 5, 2));

                if (!DimensionsAreSafe(width, height))
                {
                    error = "Kích thước ảnh quá lớn hoặc không hợp lệ.";
                    return false;
                }

                foundFrame = true;
            }

            offset += segmentLength;
        }

        if (!foundFrame)
        {
            error = "Tệp JPEG thiếu thông tin ảnh hoặc đã bị hỏng.";
            return false;
        }

        return true;
    }

    private static bool IsStartOfFrame(byte marker)
        => marker is >= 0xC0 and <= 0xC3 or
                     >= 0xC5 and <= 0xC7 or
                     >= 0xC9 and <= 0xCB or
                     >= 0xCD and <= 0xCF;

    private static bool DimensionsAreSafe(uint width, uint height)
        => width > 0 && height > 0 &&
           width <= MaxImageDimension && height <= MaxImageDimension &&
           (long)width * height <= MaxImagePixels;
}
