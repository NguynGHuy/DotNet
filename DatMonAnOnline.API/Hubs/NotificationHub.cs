using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DatMonAnOnline.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
    }
}