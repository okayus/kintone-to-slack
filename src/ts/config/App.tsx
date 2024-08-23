import React, { useEffect, useState } from "react";
import Form from "@rjsf/mui";
import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

interface AppProps {
  pluginId: string;
}

const baseSchema: RJSFSchema = {
  title: "Todo",
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string", title: "Title", default: "A new task" },
    type: {
      type: "string",
      title: "Type",
      enum: ["Work", "Personal", "Shopping", "Health", "Other"],
      default: "Work",
    },
    done: { type: "boolean", title: "Done?", default: false },
    status: { type: "string", title: "Status", enum: [] },
  },
};

const log = (type: string) => console.log.bind(console, type);

const App: React.FC<AppProps> = ({ pluginId }) => {
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchStatus = async () => {
      const body = {
        app: kintone.app.getId(),
      };
      try {
        const response = await kintone.api(
          kintone.api.url("/k/v1/app/status.json", true),
          "GET",
          body,
        );
        console.log("response:", response); // 取得したステータスをコンソールに表示
        const statusKeys = Object.keys(response.states);
        setStatusOptions(statusKeys);
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    };

    fetchStatus();

    const config = kintone.plugin.app.getConfig(pluginId);
    console.log("Plugin Config:", config);
  }, [pluginId]);

  const handleSubmit = (
    data: IChangeEvent<any, RJSFSchema, any>,
    event: React.FormEvent<any>,
  ) => {
    console.log("submit", event);
    const { formData } = data;
    const configSetting = { config: formData };
    // ここでKintoneのプラグイン設定にデータを保存
    kintone.plugin.app.setConfig(
      { config: JSON.stringify(configSetting) },
      function () {
        alert("設定が保存されました。");
        window.location.href = "../../flow?app=" + kintone.app.getId();
      },
    );
  };

  // スキーマを動的に更新
  const dynamicSchema = {
    ...baseSchema,
    properties: {
      ...baseSchema.properties,
      status: {
        ...(typeof baseSchema.properties?.status === "object" &&
        baseSchema.properties.status !== null
          ? baseSchema.properties.status
          : {}), // statusプロパティがオブジェクトかどうかを確認
        enum: statusOptions, // APIから取得したステータスを設定
      },
    },
  };

  return (
    <Form
      schema={dynamicSchema}
      validator={validator}
      onChange={log("changed")}
      onSubmit={handleSubmit}
      onError={log("errors")}
    />
  );
};

export default App;
