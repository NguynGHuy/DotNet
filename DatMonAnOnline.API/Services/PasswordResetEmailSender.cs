using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Threading.Channels;

namespace DatMonAnOnline.API.Services;

public sealed class SmtpEmailOptions
{
    public const string SectionName = "Email:Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Đặt Món Ăn";

    public bool IsValid()
        => !string.IsNullOrWhiteSpace(Host) &&
           Port is > 0 and <= 65535 &&
           !string.IsNullOrWhiteSpace(FromAddress);
}

public interface IPasswordResetEmailSender
{
    Task SendAsync(
        string recipientEmail,
        string confirmationCode,
        int expiresAfterMinutes,
        CancellationToken cancellationToken = default);
}

public sealed class SmtpPasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly SmtpEmailOptions _options;

    public SmtpPasswordResetEmailSender(IOptions<SmtpEmailOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendAsync(
        string recipientEmail,
        string confirmationCode,
        int expiresAfterMinutes,
        CancellationToken cancellationToken = default)
    {
        if (!_options.IsValid())
            throw new InvalidOperationException("Cấu hình SMTP chưa đầy đủ.");

        cancellationToken.ThrowIfCancellationRequested();

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = "Mã xác nhận đặt lại mật khẩu",
            Body = $"Mã xác nhận của bạn là: {confirmationCode}\n\n" +
                   $"Mã có hiệu lực trong {expiresAfterMinutes} phút. " +
                   "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.",
            IsBodyHtml = false
        };
        message.To.Add(new MailAddress(recipientEmail));

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        if (!string.IsNullOrWhiteSpace(_options.UserName))
            client.Credentials = new NetworkCredential(_options.UserName, _options.Password);

        await client.SendMailAsync(message, cancellationToken);
    }
}

public sealed record PasswordResetEmail(
    string RecipientEmail,
    string ConfirmationCode,
    int ExpiresAfterMinutes);

public interface IPasswordResetEmailQueue
{
    bool TryQueue(PasswordResetEmail email);
}

public sealed class PasswordResetEmailQueue : BackgroundService, IPasswordResetEmailQueue
{
    private readonly Channel<PasswordResetEmail> _channel =
        Channel.CreateUnbounded<PasswordResetEmail>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });

    private readonly IPasswordResetEmailSender _sender;
    private readonly ILogger<PasswordResetEmailQueue> _logger;

    public PasswordResetEmailQueue(
        IPasswordResetEmailSender sender,
        ILogger<PasswordResetEmailQueue> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public bool TryQueue(PasswordResetEmail email)
        => _channel.Writer.TryWrite(email);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var email in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await _sender.SendAsync(
                    email.RecipientEmail,
                    email.ConfirmationCode,
                    email.ExpiresAfterMinutes,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Không thể gửi email đặt lại mật khẩu tới địa chỉ đã được che giấu.");
            }
        }
    }
}
