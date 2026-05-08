export function getNotificationRoute(notification) {
  if (!notification || !notification.type) {
    return "/notifications";
  }

  const { type, conversationId, sender, orderId, postId, liveSessionId } = notification;

  switch (type) {
    case "chat_message":
      if (sender) return `/messages?to=${sender}`;
      if (conversationId) return `/messages?conversation=${conversationId}`;
      return "/messages";

    case "order":
    case "order_status":
      return orderId ? `/order/${orderId}` : "/notifications";

    case "live_started":
    case "live_ended":
    case "live":
      return liveSessionId ? `/live/${liveSessionId}` : "/live";

    case "post_comment":
    case "comment_reply":
      return postId ? `/feed?post=${postId}` : "/feed";

    default:
      return "/notifications";
  }
}
