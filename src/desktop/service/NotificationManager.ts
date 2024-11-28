import { HierarchicalError } from "../../shared/errors/HierarchicalError";

import { SlackService } from "./SlackService";

import type { ConfigSchema } from "../../shared/types/Config";

type RecordData = Record<string, { value: string }>;
type MessageTemplate = {
  title: string;
  body: string;
  footer: string;
};

export class NotificationManager {
  private slackService: SlackService;
  private config: ConfigSchema["notificationSettings"][number];

  constructor(
    slackService: SlackService,
    config: ConfigSchema["notificationSettings"][number],
  ) {
    this.slackService = slackService;
    this.config = config;
  }

  public async notify(
    records: Array<Record<string, { value: string }>>,
  ): Promise<void> {
    try {
      if (records.length === 0) {
        return;
      }
      await this.inviteMembersToChannel(records);

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
    } catch (error) {
      // alert(`エラーが発生しました\n${error}`);
      // throw new Error(`エラー発生メソッド：notify\nエラー内容：${error}`);
      const errorMessage =
        error instanceof HierarchicalError
          ? (error as Error).toString()
          : (error as Error).message;
      alert(`エラーが発生しました\n${errorMessage}`);
      throw new Error(`Slack通知エラー\n ${errorMessage}`);
    }
  }

  private async inviteMembersToChannel(records: RecordData[]): Promise<void> {
    try {
      console.log("Inviting members to channel", this.config.slackChannelId);
      const slackIdField: string[] = this.config.slackIdField || [];
      if (slackIdField.length === 0) {
        console.warn("Slack ID field is not set");
        return;
      }
      const memberIds = new Set(
        records.flatMap((record) =>
          slackIdField
            .map((fieldCode) => record[fieldCode]?.value)
            .filter(Boolean),
        ),
      );
      console.log("Member IDs:", memberIds);
      const currentMembers = await this.slackService.getChannelMembers(
        this.config.slackChannelId,
      );
      console.log("Current members:", currentMembers);
      const nonMembers = Array.from(memberIds).filter(
        (id) => !currentMembers.includes(id),
      );
      console.log("Non-members:", nonMembers);

      if (nonMembers.length > 0) {
        await this.slackService.inviteMembersToChannel(
          this.config.slackChannelId,
          nonMembers,
        );
      }
    } catch (error) {
      throw new HierarchicalError(
        "エラー発生メソッド：inviteMembersToChannel",
        error as Error,
      );
    }
  }

  public generateMessages(
    records: RecordData[],
    messageTemplate: MessageTemplate,
  ): string[] {
    try {
      const messages: string[] = [];
      const title = messageTemplate.title;
      const footer = messageTemplate.footer || "";

      const MAX_LENGTH = 3000 - title.length - footer.length;

      const replacePlaceholders = (
        template: string,
        record: RecordData,
      ): string => {
        return template.replace(/\{(.*?)\}/g, (_, fieldCode) => {
          const fieldValue = record[fieldCode]?.value;
          if (fieldValue === undefined) {
            console.warn(
              `フィールドコード "${fieldCode}" の値が見つかりません`,
            );
            return `{${fieldCode}}`;
          }
          return fieldValue;
        });
      };

      let currentMessage = `${title}\n`;

      records.forEach((record) => {
        const body = replacePlaceholders(messageTemplate.body, record);
        const recordMessage = `${body}\n`;

        if (currentMessage.length + recordMessage.length > MAX_LENGTH) {
          // 現在のメッセージを確定
          currentMessage += footer;
          messages.push(currentMessage);

          // 次のメッセージを新しく開始
          currentMessage = `${title}\n${recordMessage}`;
        } else {
          // 現在のメッセージにレコードを追加
          currentMessage += recordMessage;
        }
      });

      // 最後のメッセージを確定
      if (currentMessage.length > title.length + footer.length) {
        currentMessage += footer;
        messages.push(currentMessage);
      }

      return messages;
    } catch (error) {
      throw new HierarchicalError(
        "エラー発生メソッド：generateMessages",
        error as Error,
      );
    }
  }

  private async updateRecordsWithNotificationDetails(
    records: Array<Record<string, { value: string }>>,
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
          [String(this.config.notificationDateTimeField)]: {
            value: notificationDateTime,
          },
        },
      };
      return kintone.api("/k/v1/record", "PUT", updatePayload);
    });

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      throw new HierarchicalError(
        "エラー発生メソッド：updateRecordsWithNotificationDetails",
        error as Error,
      );
    }
  }
}
