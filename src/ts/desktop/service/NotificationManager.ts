import { SlackService } from "./SlackService";

type RecordData = Record<string, { value: string }>;
type MessageTemplate = {
  title: string;
  body: string;
  footer: string;
};

export class NotificationManager {
  private slackService: SlackService;
  private config: {
    recordListId: string;
    slackChannelId: string;
    slackIdField: string[];
    messageTemplate: MessageTemplate;
    notificationCondition: Array<{
      field: string;
      operator: string;
      value: string;
    }> | null;
    notificationLinkField: string;
    notificationDateTimeField: string;
  };

  constructor(slackService: SlackService, config: any) {
    this.slackService = slackService;
    this.config = config;
  }

  public async notify(records: any[]): Promise<void> {
    if (records.length === 0) {
      return;
    }
    this.inviteMembersToChannel(records);

    const messages = this.generateMessages(
      records,
      this.config.messageTemplate,
    );

    let threadTs: string | undefined = undefined;

    for (const message of messages) {
      threadTs = await this.slackService.postMessage(
        this.config.slackChannelId,
        message,
        threadTs, // スレッドを指定（初回は undefined なのでスレッド作成）
      );
    }

    if (!threadTs) {
      throw new Error("Failed to post message");
    }
    await this.updateRecordsWithNotificationDetails(records, threadTs);
  }

  private async inviteMembersToChannel(records: RecordData[]): Promise<void> {
    const memberIds = new Set(
      records.flatMap((record) =>
        this.config.slackIdField
          .map((fieldCode) => record[fieldCode]?.value)
          .filter(Boolean),
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
  }

  private generateMessages(
    records: RecordData[],
    messageTemplate: MessageTemplate,
  ): string[] {
    const messages: string[] = [];
    const title = messageTemplate.title;
    const footer = messageTemplate.footer;

    let currentMessage = `${title}\n`;
    const MAX_LENGTH = 3000;

    const replacePlaceholders = (
      template: string,
      record: RecordData,
    ): string => {
      return template.replace(/\{(.*?)\}/g, (_, fieldCode) => {
        const fieldValue = record[fieldCode]?.value;
        if (fieldValue === undefined) {
          console.warn(`フィールドコード "${fieldCode}" の値が見つかりません`);
          return `{${fieldCode}}`;
        }
        return fieldValue;
      });
    };

    records.forEach((record, index) => {
      const body = replacePlaceholders(messageTemplate.body, record);
      const recordMessage = `${body}\n`;

      // 次のレコードを追加したときに3000文字を超えるかチェック
      if (
        currentMessage.length + recordMessage.length + footer.length >
        MAX_LENGTH
      ) {
        currentMessage += footer;
        messages.push(currentMessage);

        currentMessage = `${title}\n${recordMessage}`;
      } else {
        currentMessage += `${recordMessage}`;
      }
    });

    // 最後のメッセージを確定させる
    if (currentMessage.length > title.length + footer.length) {
      currentMessage += footer;
      messages.push(currentMessage);
    }

    return messages;
  }

  private async updateRecordsWithNotificationDetails(
    records: any[],
    threadTs: string,
  ): Promise<void> {
    const slackMessageLink = `https://slack.com/app_redirect?channel=${this.config.slackChannelId}&message=${threadTs}`;
    const notificationDateTime = new Date().toISOString();

    const updatePromises = records.map((record) => {
      const recordId = record.$id.value;
      const updatePayload = {
        app: kintone.app.getId(),
        id: recordId,
        record: {
          [this.config.notificationLinkField]: {
            value: slackMessageLink,
          },
          [this.config.notificationDateTimeField]: {
            value: notificationDateTime,
          },
        },
      };
      return kintone.api("/k/v1/record", "PUT", updatePayload);
    });

    try {
      await Promise.all(updatePromises);
      console.log("Records successfully updated with notification details");
    } catch (error) {
      console.error("Failed to update records:", error);
      throw new Error("Failed to update records with notification details");
    }
  }
}
