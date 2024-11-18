import { SlackService } from "./SlackService";

export class NotificationManager {
  private slackService: SlackService;
  private config: {
    recordListId: string;
    slackChannelId: string;
    messageTemplate: string;
    notificationCondition: { field: string; operator: string; value: string };
    notificationLinkField: string;
  };

  constructor(slackService: SlackService, config: any) {
    this.slackService = slackService;
    this.config = config;
  }

  public async notify(records: any[]): Promise<void> {
    const memberIds = new Set(
      records.flatMap((record) =>
        [record.slackid?.value, record.slackid2?.value].filter(Boolean),
      ),
    );
    const currentMembers = await this.slackService.getChannelMembers(
      this.config.slackChannelId,
    );
    const nonMembers = Array.from(memberIds).filter(
      (id) => !currentMembers.includes(id),
    );

    if (nonMembers.length > 0) {
      await this.slackService.inviteMembersToChannel(
        this.config.slackChannelId,
        nonMembers,
      );
    }

    const messages = this.generateMessages(records);
    console.log("Messages to post:", messages);
    console.log("this.config", this.config);
    for (const message of messages) {
      const ts = await this.slackService.postMessage(
        this.config.slackChannelId,
        message,
      );
      console.log(`Message posted with ts: ${ts}`);
    }
  }

  private generateMessages(records: any[]): string[] {
    const messages: string[] = [];
    let currentMessage = "";

    for (const record of records) {
      const message = this.config.messageTemplate.replace(
        /\[(.*?)\]/g,
        (_, fieldCode) => record[fieldCode]?.value || "",
      );
      if ((currentMessage + message).length > 3000) {
        messages.push(currentMessage);
        currentMessage = "";
      }
      currentMessage += `${message}\n`;
    }

    if (currentMessage) messages.push(currentMessage);
    return messages;
  }
}
