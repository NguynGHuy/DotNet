using DatMonAnOnline.API.Hubs;
using DatMonAnOnline.API.Models;
using Microsoft.AspNetCore.SignalR;

namespace DatMonAnOnline.API.Services;

public interface IRealtimeNotificationService
{
    Task GuiThongBaoAsync(
        int maTaiKhoan,
        object duLieu
    );

    Task GuiDonHangMoiAsync(
        int maTaiKhoan,
        object duLieu
    );

    Task GuiDonHangCapNhatAsync(
        int maTaiKhoan,
        object duLieu
    );

    Task GuiDonHangDaHuyAsync(
        int maTaiKhoan,
        object duLieu
    );
}

public class RealtimeNotificationService
    : IRealtimeNotificationService
{
    private readonly IHubContext<NotificationHub>
        _hubContext;

    public RealtimeNotificationService(
        IHubContext<NotificationHub> hubContext
    )
    {
        _hubContext = hubContext;
    }

    public Task GuiThongBaoAsync(
        int maTaiKhoan,
        object duLieu
    )
    {
        if (duLieu is Thongbao thongBao)
        {
            var payload = new
            {
                thongBao.MaThongBao,
                thongBao.MaTaiKhoan,
                thongBao.TieuDe,
                thongBao.NoiDung,
                thongBao.Loai,
                thongBao.DuongDan,
                thongBao.DaDoc,
                thongBao.NgayTao
            };

            return GuiAsync(
                maTaiKhoan,
                "NhanThongBao",
                payload
            );
        }

        return GuiAsync(
            maTaiKhoan,
            "NhanThongBao",
            duLieu
        );
    }

    public Task GuiDonHangMoiAsync(
        int maTaiKhoan,
        object duLieu
    )
    {
        return GuiAsync(
            maTaiKhoan,
            "DonHangMoi",
            duLieu
        );
    }

    public Task GuiDonHangCapNhatAsync(
        int maTaiKhoan,
        object duLieu
    )
    {
        return GuiAsync(
            maTaiKhoan,
            "DonHangCapNhat",
            duLieu
        );
    }

    public Task GuiDonHangDaHuyAsync(
        int maTaiKhoan,
        object duLieu
    )
    {
        return GuiAsync(
            maTaiKhoan,
            "DonHangDaHuy",
            duLieu
        );
    }

    private Task GuiAsync(
        int maTaiKhoan,
        string tenSuKien,
        object duLieu
    )
    {
        return _hubContext.Clients
            .User(maTaiKhoan.ToString())
            .SendAsync(
                tenSuKien,
                duLieu
            );
    }
}