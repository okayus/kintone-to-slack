import { useCallback } from "react";

interface AppProps {
  config: any;
}

export const useOnClickButton = (config: AppProps) => {
  const onClickButton = useCallback(async () => {
    const url = "";
    await inviteChannel(url);
    // await sendSlackMessage(url, "テスト");
    console.log("config:", config);
  }, [config]);
  return { onClickButton };
};

const inviteChannel = async (token: string) => {
  const url = "https://slack.com/api/conversations.invite";
  const payload = {
    token: token,
    channel: "C080WTUDJUC",
    users: "U080MNER7L6, U081H4W0HLG",
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await kintone.proxy(url, "POST", headers, payload);

    console.log(response);
    const result = JSON.parse(response[0]);

    if (!result.ok) {
      console.error("Slack message failed:", result.error);
    } else {
      console.log("Slack message sent successfully");
    }
  } catch (error) {
    console.error("Error sending Slack message:", error);
  }
};

const sendSlackMessage = async (token: string, message: string) => {
  const url = "https://slack.com/api/chat.postMessage";
  const payload = {
    channel: "C06RQEZCFUN", // チャンネルIDを指定してください
    text: message,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await kintone.proxy(url, "POST", headers, payload);

    console.log(response);
    const result = JSON.parse(response[0]);

    if (!result.ok) {
      console.error("Slack message failed:", result.error);
    } else {
      console.log("Slack message sent successfully");
    }
  } catch (error) {
    console.error("Error sending Slack message:", error);
  }
};
