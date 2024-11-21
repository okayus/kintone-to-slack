export class SlackService {
  private botToken: string;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  async getChannelMembers(channelId: string): Promise<string[]> {
    const url = `https://slack.com/api/conversations.members?channel=${channelId}`;
    const headers = {
      Authorization: `Bearer ${this.botToken}`,
    };
    const [responseBody, statusCode] = await kintone.proxy(
      url,
      "GET",
      headers,
      {},
    );

    if (statusCode !== 200) {
      console.error("Error response from Slack:", responseBody);
      throw new Error("Failed to fetch channel members");
    }

    const data = JSON.parse(responseBody);
    if (!data.ok) {
      console.error("Slack API Error:", data.error);
      throw new Error(`Failed to fetch channel members: ${data.error}`);
    }

    return data.members;
  }

  async inviteMembersToChannel(channelId: string, userIds: string[]) {
    const url = "https://slack.com/api/conversations.invite";
    const payload = {
      token: this.botToken,
      channel: channelId,
      users: userIds.join(","),
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.botToken}`,
    };

    const [responseBody, statusCode] = await kintone.proxy(
      url,
      "POST",
      headers,
      payload,
    );

    if (statusCode !== 200) {
      console.error("Error response from Slack:", responseBody);
      throw new Error("Failed to invite members to channel");
    }

    const data = JSON.parse(responseBody);
    if (!data.ok) {
      console.error("Slack API Error:", data.error);

      // 無効なユーザーが含まれていた場合に詳細をログに記録
      if (data.error === "users_not_found") {
        console.error(`Invalid users in the request: ${userIds}`);
      }

      // 必ずエラーをスロー
      throw new Error(`Failed to invite members to channel: ${data.error}`);
    }
  }
  async postMessage(
    channelId: string,
    text: string,
    threadTs?: string,
  ): Promise<string> {
    const url = "https://slack.com/api/chat.postMessage";
    const payload = {
      channel: channelId,
      text,
      ...(threadTs && { thread_ts: threadTs }), // スレッド指定がある場合に追加
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.botToken}`,
    };

    const [responseBody, statusCode] = await kintone.proxy(
      url,
      "POST",
      headers,
      payload,
    );

    if (statusCode !== 200) {
      console.error("Error response from Slack:", responseBody);
      throw new Error("Failed to post message");
    }

    const data = JSON.parse(responseBody);
    if (!data.ok) {
      console.error("Slack API Error:", data.error);
      throw new Error(`Failed to post message: ${data.error}`);
    }

    return data.ts;
  }

  // エラー時にWebhookでSlackにエラー内容を通知する
  async postErrorMessageToSlack(error: Error, webhookUrl: string) {
    console.error("webhook error", error);
    console.error("webhook url", webhookUrl);

    const payload = {
      text: `Error occurred in kintone app: ${error.message}`,
    };

    await kintone.proxy(
      webhookUrl,
      "POST",
      {},
      payload,
      (resp) => {
        console.log(resp);
      },
      (err) => {
        console.error(err);
      },
    );
  }
}
