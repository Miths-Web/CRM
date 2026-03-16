using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace CRM.API.Hubs
{
    /// <summary>
    /// SignalR Hub — Real-time notifications for all CRM users.
    /// Frontend connects via /hubs/notifications
    /// </summary>
    public class NotificationHub : Hub
    {
        // Called when a client connects
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (userId != null)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }

    /// <summary>
    /// Service to send real-time notifications from anywhere in the app.
    /// Inject INotificationService and call SendAsync methods.
    /// </summary>
    public interface INotificationService
    {
        Task NotifyUserAsync(string userId, string eventType, object data);
        Task NotifyAllAsync(string eventType, object data);
        Task NotifyGroupAsync(string group, string eventType, object data);
    }

    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifyUserAsync(string userId, string eventType, object data)
        {
            await _hubContext.Clients.Group($"user_{userId}")
                .SendAsync("Notification", new { type = eventType, data, timestamp = DateTime.UtcNow });
        }

        public async Task NotifyAllAsync(string eventType, object data)
        {
            await _hubContext.Clients.All
                .SendAsync("Notification", new { type = eventType, data, timestamp = DateTime.UtcNow });
        }

        public async Task NotifyGroupAsync(string group, string eventType, object data)
        {
            await _hubContext.Clients.Group(group)
                .SendAsync("Notification", new { type = eventType, data, timestamp = DateTime.UtcNow });
        }
    }
}
