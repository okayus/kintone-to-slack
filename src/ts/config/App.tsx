import React, { useEffect, useState } from "react";

import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { CacheAPI } from "../common/util/CacheAPI";

import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema } from "@rjsf/utils";

interface AppProps {
  pluginId: string;
  cacheAPI: CacheAPI;
}

const log = (type: string) => console.log.bind(console, type);

const App: React.FC<AppProps> = ({ pluginId, cacheAPI }) => {
  const [appOptions, setAppOptions] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await cacheAPI.getApps();
        const appItemOptions = response.apps.map((app: any) => ({
          const: app.appId,
          title: app.name,
        }));
        setAppOptions(appItemOptions);

        const responseConfig = kintone.plugin.app.getConfig(pluginId);
        if (responseConfig.config) {
          setFormData(JSON.parse(responseConfig.config).config);
        }
      } catch (error) {
        console.error("Failed to fetch apps:", error);
      }
    };

    fetchApps();
  }, [pluginId, cacheAPI]);

  const handleSubmit = (data: IChangeEvent<any>) => {
    const configSetting = { config: data.formData };
    kintone.plugin.app.setConfig(
      { config: JSON.stringify(configSetting) },
      function () {
        alert("設定が保存されました。");
        window.location.href = "../../flow?app=" + kintone.app.getId();
      },
    );
  };

  const dynamicSchema = {
    type: "object",
    properties: {
      commonSettings: {
        type: "object",
        properties: {
          slackBotToken: {
            type: "string",
            description: "Slackボットのトークン",
          },
          errorNotificationWebhook: {
            type: "string",
            description: "エラー時の通知用Webhook URL",
          },
        },
        required: ["slackBotToken", "errorNotificationWebhook"],
        description: "共通設定",
      },
      notificationSettings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            recordListId: {
              type: "string",
              description: "対象のレコード一覧のID",
            },
            buttonName: {
              type: "string",
              description: "通知ボタンの表示名",
            },
            slackChannelId: {
              type: "string",
              description: "通知先のSlackチャンネルID",
            },
            slackIdField: {
              type: "array",
              items: {
                type: "string",
              },
              description: "チャンネルに招待するユーザーのIDのフィールド",
            },
            messageTemplate: {
              type: "string",
              description:
                "通知メッセージのテンプレート（例: '@[slackidフィールド] [文字列1行フィールド]）",
            },
            notificationCondition: {
              type: "object",
              description: "通知対象レコードの条件",
              properties: {
                field: {
                  type: "string",
                  description: "条件に使用するフィールド名",
                },
                operator: {
                  type: "string",
                  enum: ["equals", "notEquals", "isEmpty", "isNotEmpty"],
                  description: "条件演算子",
                },
                value: {
                  type: ["string", "null"],
                  description: "条件値（必要に応じて指定）",
                },
              },
              required: ["field", "operator"],
            },
            notificationLinkField: {
              type: "string",
              description: "通知後にリンクを入力するフィールド名",
            },
          },
          required: [
            "recordListId",
            "slackChannelId",
            "messageTemplate",
            "notificationLinkField",
          ],
        },
        description: "複数の通知設定",
      },
    },
    required: ["commonSettings", "notificationSettings"],
  };

  return (
    <Form
      schema={dynamicSchema as RJSFSchema}
      validator={validator}
      formData={formData}
      onSubmit={handleSubmit}
      onError={log("errors")}
    />
  );
};

export default App;
