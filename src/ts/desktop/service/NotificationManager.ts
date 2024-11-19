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
    for (const message of messages) {
      const response = await this.slackService.postMessage(
        this.config.slackChannelId,
        message,
      );
      console.log("response", response);
    }
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
          return `{${fieldCode}}`; // 置き換えられない場合はそのまま残す
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
        // 現在のメッセージを確定させ、新しいメッセージを開始
        currentMessage += footer;
        messages.push(currentMessage);

        currentMessage = `${title}\n${recordMessage}`;
      } else {
        // 現在のメッセージに追加
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
}
