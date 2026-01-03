import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  async getNotifications(userId: string) {
    // TODO: Implement notification retrieval
    return {
      message: "Notifications module - coming soon",
      userId,
    };
  }
}
