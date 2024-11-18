import Sdk, { Sdk } from "../common/util/kintoneSdk";

// Slack APIに関する操作をカプセル化したクラス
class SlackService {
  private botToken: string;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  // チャンネルに参加中のメンバーを取得
  async getChannelMembers(channelId: string): Promise<string[]> {
    const response = await fetch(
      `https://slack.com/api/conversations.members?channel=${channelId}`,
      {
        headers: { Authorization: `Bearer ${this.botToken}` },
      },
    );
    const data = await response.json();
    if (!data.ok) throw new Error("Failed to fetch channel members");
    return data.members;
  }

  // メンバーをチャンネルに招待
  async inviteMembersToChannel(channelId: string, userIds: string[]) {
    const response = await fetch("https://slack.com/api/conversations.invite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: channelId, users: userIds.join(",") }),
    });
    const data = await response.json();
    if (!data.ok) throw new Error("Failed to invite members to channel");
  }

  // メッセージを送信
  async postMessage(channelId: string, text: string): Promise<string> {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: channelId, text }),
    });
    const data = await response.json();
    if (!data.ok) throw new Error("Failed to post message");
    return data.message.ts; // メッセージのタイムスタンプを返す
  }
}

// 通知処理を管理するクラス
class NotificationManager {
  private slackService: SlackService;
  private client: typeof Sdk;
  private config: {
    recordListId: string;
    slackChannelId: string;
    messageTemplate: string;
    notificationCondition: any;
    notificationLinkField: string;
  };

  constructor(slackService: SlackService, client: typeof Sdk, config: any) {
    this.slackService = slackService;
    this.client = client;
    this.config = config;
  }

  // レコードを取得
  private async fetchRecords(): Promise<any[]> {
    const query = `${this.config.notificationCondition.field} ${this.config.notificationCondition.operator} "${this.config.notificationCondition.value}"`;
    const records = await this.client.getFields(kintone.app.getId()!);
    return [records];
  }

  // メッセージを生成
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

  // 通知リンクを更新
  private async updateNotificationLinks(records: any[], link: string) {
    const updatePromises = records.map((record) => {
      return this.client.record.updateRecord({
        app: kintone.app.getId()!,
        id: record.$id.value,
        record: { [this.config.notificationLinkField]: { value: link } },
      });
    });
    await Promise.all(updatePromises);
  }

  // 通知処理
  public async notify() {
    const records = await this.fetchRecords();
    if (!records.length) return;

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
    if (nonMembers.length) {
      await this.slackService.inviteMembersToChannel(
        this.config.slackChannelId,
        nonMembers,
      );
    }

    const messages = this.generateMessages(records);
    for (const message of messages) {
      const ts = await this.slackService.postMessage(
        this.config.slackChannelId,
        message,
      );
      const slackLink = `https://slack.com/app_redirect?channel=${this.config.slackChannelId}&message=${ts}`;
      await this.updateNotificationLinks(records, slackLink);
    }
  }
}

((PLUGIN_ID) => {
  kintone.events.on(["app.record.index.show"], (event) => {
    const pluginConfig = kintone.plugin.app.getConfig("your_plugin_id");
    const config = JSON.parse(pluginConfig || "{}");
    const slackService = new SlackService(config.slackBotToken);
    const client = new KintoneRestAPIClient();

    if (kintone.app.getViewId() === config.recordListId) {
      const notificationManager = new NotificationManager(
        slackService,
        client,
        config,
      );

      // ボタンのレンダリング
      const container = document.createElement("div");
      const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
      if (headerMenuSpace) {
        headerMenuSpace.appendChild(container);

        const button = document.createElement("button");
        button.textContent = "通知する";
        button.onclick = () => notificationManager.notify();
        container.appendChild(button);
      }
    }
  });
})(kintone.$PLUGIN_ID);
