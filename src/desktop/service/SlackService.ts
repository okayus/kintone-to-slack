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
      throw new Error(
        `Slack API conversations.membersメソッドのエラー: ${responseBody}`,
      );
    }

    const data = JSON.parse(responseBody);
    if (!data.ok) {
      throw new Error(
        `Slack API conversations.membersメソッドのエラー: ${data.error}、チャンネルID: ${channelId}`,
      );
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
      throw new Error(
        `Slack API conversations.inviteメソッドのエラー: ${responseBody}`,
      );
    }

    const data = JSON.parse(responseBody);
    if (!data.ok) {
      throw new Error(
        `Slack API conversations.inviteメソッドのエラー: ${data.error}、ユーザーID: ${userIds}`,
      );
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
      // console.error("Error response from Slack:", responseBody);
      // エラーを日本語で通知する
      throw new Error(
        `Slack API chat.postMessageメソッドのエラー: ${responseBody}`,
      );
    }

    const data = JSON.parse(responseBody);
    if (!data.ok) {
      throw new Error(
        `Slack API chat.postMessageメソッドのエラー: ${data.error}、チャンネルID: ${channelId}`,
      );
    }

    return data.ts;
  }

  // エラー時にWebhookでSlackにエラー内容を通知する
  async postErrorMessageToSlack(errorMessage: string, webhookUrl: string) {
    const payload = {
      text: errorMessage,
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
