import React from "react";
import { createRoot } from "react-dom/client";

import { KintoneSdk } from "../shared/util/kintoneSdk";

import NotifyButton from "./components/NotifyButton";
import { NotificationManager } from "./service/NotificationManager";
import { SlackService } from "./service/SlackService";

import type { ConfigSchema } from "../shared/types/Config";

const renderButton = (container: HTMLElement, onClick: () => Promise<void>) => {
  createRoot(container).render(
    <NotifyButton onClick={onClick} buttonLabel="通知する" />,
  );
};

interface KintoneEvent {
  record: Record<string, { value: string }>;
  viewId: number;
  viewName: string;
}

// メイン処理
((PLUGIN_ID) => {
  kintone.events.on("app.record.index.show", async (event: KintoneEvent) => {
    const pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID).config;
    if (!pluginConfig) return;

    const config: ConfigSchema = JSON.parse(pluginConfig).config;
    const slackService = new SlackService(config.commonSettings.slackBotToken);
    const kintoneSdk = new KintoneSdk();

    config.notificationSettings.forEach(
      (notificationSetting: ConfigSchema["notificationSettings"][number]) => {
        const shouldRenderButton =
          notificationSetting.recordListId === event.viewId.toString();
        if (shouldRenderButton) {
          const notificationManager = new NotificationManager(
            slackService,
            notificationSetting,
            kintoneSdk,
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
              const records = (
                await kintoneSdk.getRecords(appId, [], condition)
              ).records;

              if (!records.length) {
                alert("対象レコードがありません");
                return;
              }

              await notificationManager.notify(
                records as Array<Record<string, { value: string }>>,
              );
              alert("通知が完了しました");
            } catch (error) {
              const messageHeader =
                config.commonSettings.errorNotificationHeader || "";
              const errorMessage = `${messageHeader}\nSlack一括通知プラグインでエラーが発生しました。\nappId: ${kintone.app.getId()}\nviewName: ${event.viewName}\nviewId: ${event.viewId}\n${(error as Error).message}`;
              await slackService.postErrorMessageToSlack(
                errorMessage,
                config.commonSettings.errorNotificationWebhook,
              );
            } finally {
              // window.location.reload();
            }
          });
        }
      },
    );
  });
})(kintone.$PLUGIN_ID);
