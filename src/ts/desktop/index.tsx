import Sdk from "../common/util/kintoneSdk";

import { NotificationManager } from "./service/NotificationManager";
import { SlackService } from "./service/SlackService";

// ボタンの描画
const renderButton = (onClick: () => void) => {
  const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
  if (!headerMenuSpace) return;

  const container = document.createElement("div");
  const button = document.createElement("button");
  button.textContent = "通知する";
  button.onclick = onClick;

  container.appendChild(button);
  headerMenuSpace.appendChild(container);
};

interface KintoneEvent {
  record: any;
  viewId: number;
}
((PLUGIN_ID) => {
  // メイン処理
  kintone.events.on("app.record.index.show", async (event: KintoneEvent) => {
    const pluginConfig = kintone.plugin.app.getConfig(PLUGIN_ID).config;
    if (!pluginConfig) return;

    const config = JSON.parse(pluginConfig).config;
    const slackService = new SlackService(config.commonSettings.slackBotToken);

    // ビューが一致する場合にボタンを追加
    console.log(
      "config.notificationSettings[].recordListId",
      config.notificationSettings[0].recordListId,
    );
    console.log("event.viewId", event.viewId);
    // if (event.viewId === config.recordListId) {
    config.notificationSettings.forEach((notificationSetting: any) => {
      // const shouldRenderButton =
      //   notificationSetting.recordListId === event.viewId;
      // if (shouldRenderButton) continue;
      const notificationManager = new NotificationManager(
        slackService,
        notificationSetting,
      );
      const onNotifyButtonClick = async () => {
        try {
          const appId = kintone.app.getId();
          if (!appId) throw new Error("アプリIDを取得できませんでした");

          const condition = kintone.app.getQueryCondition() || "";
          const records = (await Sdk.getRecords(appId, [], condition)).records;
          console.log("records", records);

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
      };

      renderButton(onNotifyButtonClick);
    });
    // const notificationManager = new NotificationManager(slackService, config);

    // // ボタンクリックイベント
    // const onNotifyButtonClick = async () => {
    //   try {
    //     const appId = kintone.app.getId();
    //     if (!appId) throw new Error("アプリIDを取得できませんでした");

    //     const condition = `${config.notificationCondition.field} ${config.notificationCondition.operator} "${config.notificationCondition.value}"`;
    //     const records = (await Sdk.getRecords(appId, [], condition)).records;

    //     if (!records.length) {
    //       alert("対象レコードがありません");
    //       return;
    //     }

    //     await notificationManager.notify(records);
    //     alert("通知が完了しました");
    //   } catch (error) {
    //     console.error("通知処理中にエラーが発生しました:", error);
    //     alert("通知処理中にエラーが発生しました");
    //   }
    // };

    // renderButton(onNotifyButtonClick);
    // }
  });
})(kintone.$PLUGIN_ID);
