import React, { useEffect, useState } from "react";

import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import Sdk from "../shared/util/kintoneSdk";

import type { ConfigSchema } from "../shared/types/Config";
import type { kintoneType } from "../shared/util/kintoneSdk";
import type { Properties } from "@kintone/rest-api-client/lib/src/client/types";
import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema } from "@rjsf/utils";

interface AppProps {
  pluginId: string;
}

const log = (type: string) => console.log.bind(console, type);

const generateFieldOptions = (
  properties: Properties,
  fields: kintoneType[],
) => {
  const options = Object.keys(properties)
    .filter((fieldCode) => fields.includes(properties[fieldCode].type))
    .map((fieldCode) => {
      return {
        const: fieldCode,
        title: properties[fieldCode].label,
      };
    });
  options.unshift({ const: "", title: "" });
  return options;
};

const ConfigForm: React.FC<AppProps> = ({ pluginId }) => {
  const [slackIdFieldOptions, setSlackIdFieldOptions] = useState<any[]>([]);
  const [notificationLinkFieldOptions, setNotificationLinkFieldOptions] =
    useState<any[]>([]);
  const [
    notificationDateTimeFieldOptions,
    setNotificationDateTimeFieldOptions,
  ] = useState<any[]>([]);
  const [viewIdOptions, setViewIdOptions] = useState<any[]>([]);
  const [formData, setFormData] = useState<ConfigSchema>({} as ConfigSchema);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await Sdk.getFields(Number(kintone.app.getId()));

        const slackIdFieldItemOptions = generateFieldOptions(response, [
          "SINGLE_LINE_TEXT",
        ]);
        setSlackIdFieldOptions(slackIdFieldItemOptions);

        const notificationLinkFieldItemOptions = generateFieldOptions(
          response,
          ["LINK"],
        );
        setNotificationLinkFieldOptions(notificationLinkFieldItemOptions);

        const notificationDateTimeFieldItemOptions = generateFieldOptions(
          response,
          ["DATETIME"],
        );
        setNotificationDateTimeFieldOptions(
          notificationDateTimeFieldItemOptions,
        );

        const responseViews = await Sdk.getViews(Number(kintone.app.getId()));
        const viewOptions = Object.keys(responseViews.views).map((view) => {
          return {
            const: responseViews.views[view].id,
            title: responseViews.views[view].name,
          };
        });
        viewOptions.unshift({ const: "20", title: "（すべて）" });
        setViewIdOptions(viewOptions);

        const responseConfig = kintone.plugin.app.getConfig(pluginId);
        if (responseConfig.config) {
          setFormData(JSON.parse(responseConfig.config).config);
        }
      } catch (error) {
        console.error("Failed to fetch apps:", error);
      }
    };

    fetchApps();
  }, [pluginId]);

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
        description: "複数の通知設定",
        items: {
          type: "object",
          properties: {
            recordListId: {
              type: "string",
              description: "対象のレコード一覧のID",
              oneOf: viewIdOptions,
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
              description: "チャンネルに招待するユーザーのIDのフィールド",
              items: {
                type: "string",
                oneOf: slackIdFieldOptions,
              },
            },
            messageTemplate: {
              type: "object",
              description:
                "通知メッセージのテンプレート（例: '@[slackidフィールド] [文字列1行フィールド]）",
              properties: {
                title: {
                  type: "string",
                  description: "メッセージタイトル",
                },
                body: {
                  type: "string",
                  description: "メッセージ本文",
                },
                footer: {
                  type: "string",
                  description: "メッセージフッター",
                },
              },
            },
            notificationLinkField: {
              type: "string",
              description: "通知後にリンクを入力するフィールド名",
              oneOf: notificationLinkFieldOptions,
            },
            notificationDateTimeField: {
              type: "string",
              description: "通知日時を入力するフィールド名",
              oneOf: notificationDateTimeFieldOptions,
            },
          },
          required: [
            "recordListId",
            "slackChannelId",
            "messageTemplate",
            "notificationLinkField",
          ],
        },
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

export default ConfigForm;
