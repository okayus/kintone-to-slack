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
      throw new Error(`Failed to invite members to channel: ${data.error}`);
    }
  }

  async postMessage(channelId: string, text: string): Promise<string> {
    const url = "https://slack.com/api/chat.postMessage";
    const payload = {
      channel: channelId,
      text,
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
}
