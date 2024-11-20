import React from "react";
import { createRoot } from "react-dom/client";

import Sdk from "../common/util/kintoneSdk";

import NotifyButton from "./components/NotifyButton";
import { NotificationManager } from "./service/NotificationManager";
import { SlackService } from "./service/SlackService";

const renderButton = (container: HTMLElement, onClick: () => Promise<void>) => {
  createRoot(container).render(
    <NotifyButton onClick={onClick} buttonLabel="通知する" />,
  );
};

interface KintoneEvent {
  record: any;
  viewId: number;
}

// メイン処理
((PLUGIN_ID) => {
  kintone.events.on("app.record.index.show", async (event: KintoneEvent) => {
    const pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID).config;
    if (!pluginConfig) return;

    const config = JSON.parse(pluginConfig).config;
    const slackService = new SlackService(config.commonSettings.slackBotToken);

    config.notificationSettings.forEach((notificationSetting: any) => {
      const shouldRenderButton =
        notificationSetting.recordListId === event.viewId.toString();
      if (shouldRenderButton) {
        const notificationManager = new NotificationManager(
          slackService,
          notificationSetting,
        );

        const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
        if (!headerMenuSpace) return;

        const container = document.createElement("div");
        headerMenuSpace.appendChild(container);

        renderButton(container, async () => {
          try {
            const appId = kintone.app.getId();
            if (!appId) throw new Error("アプリIDを取得できませんでした");

            const condition = kintone.app.getQueryCondition() || "";
            const records = (await Sdk.getRecords(appId, [], condition))
              .records;

            if (!records.length) {
              alert("対象レコードがありません");
              return;
            }

            await notificationManager.notify(records);
            alert("通知が完了しました");
          } catch (error) {
            console.error("通知処理中にエラーが発生しました:", error);
            alert("通知処理中にエラーが発生しました");
          }
        });
      }
    });
  });
})(kintone.$PLUGIN_ID);
