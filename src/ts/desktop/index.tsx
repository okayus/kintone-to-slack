import React from "react";
import { createRoot } from "react-dom/client";

// import type { SavedConfig } from "../common/types";

((PLUGIN_ID) => {
  const responseConfig = kintone.plugin.app.getConfig(PLUGIN_ID);
  // const parsedConfig = JSON.parse(responseConfig.config);
  // const config = {
  //   done: parsedConfig.config.done,
  //   status: parsedConfig.config.status,
  //   title: parsedConfig.config.config[0].mapping[0].column,
  //   type: parsedConfig.config.type,
  // };

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

  kintone.events.on(["app.record.index.show"], (event) => {
    // const div = document.createElement("div");
    // const root = createRoot(div);
    // root.render(
    //   <div>
    //     <h1>Hello, World!</h1>
    //     <p>Config: {responseConfig}</p>
    //   </div>,
    // );
    console.log("Config:", responseConfig);

    // config.titleに格納されているAPIトークンを使用してSlackにメッセージを送信
    // CORSの制約により、ブラウザから直接Slackにメッセージを送信することはできないためkintoneのapiを使用する実装に変更が必要
    // if (config.title) {
    //   sendSlackMessage(config.title, "テスト");
    // } else {
    //   console.error("APIトークンが設定されていません");
    // }

    return event;
  });
})(kintone.$PLUGIN_ID);
