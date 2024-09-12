import React, { useEffect, useState } from "react";

import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { CacheAPI } from "../common/util/CacheAPI";

import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema } from "@rjsf/utils";
import type { JSONSchema7 } from "json-schema";

interface AppProps {
  pluginId: string;
  cacheAPI: CacheAPI;
}

const baseSchema: RJSFSchema = {
  title: "config",
  type: "object",
  properties: {
    config: {
      type: "array",
      title: "設定",
      items: {
        type: "object",
        properties: {
          app: {
            type: "string",
            title: "App",
            oneOf: [],
          },
          mapping: {
            type: "array",
            title: "マッピング",
            items: {
              type: "object",
              properties: {
                field: {
                  type: "string",
                  title: "フィールド",
                  oneOf: [],
                },
                column: {
                  type: "string",
                  title: "CSVの列",
                },
              },
            },
          },
        },
      },
    },
  },
};

const log = (type: string) => console.log.bind(console, type);

const App: React.FC<AppProps> = ({ pluginId, cacheAPI }) => {
  const [appOptions, setAppOptions] = useState<any>([]);
  const [fieldOptions, setFieldOptions] = useState<any>([]);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await cacheAPI.getApps();
        const options = response.apps.map((app: any) => {
          return { const: app.appId, title: app.name };
        });
        setAppOptions(options);

        const responseConfig = kintone.plugin.app.getConfig(pluginId);
        if (responseConfig) {
          const parsedConfig = JSON.parse(responseConfig.config);
          setFormData(parsedConfig.config);
        }
      } catch (error) {
        console.error("Failed to fetch apps:", error);
      }
    };

    fetchApps();
  }, [pluginId, cacheAPI]);

  const handleAppChange = async (appId: string) => {
    try {
      const response = await cacheAPI.getFields(Number(appId));
      console.log("Fields:", response);
      const options = Object.keys(response).map((fieldCode) => {
        return { const: fieldCode, title: response[fieldCode].label };
      });
      setFieldOptions(options);
    } catch (error) {
      console.error("Failed to fetch fields:", error);
    }
  };

  const handleSubmit = (data: IChangeEvent<any, RJSFSchema, any>) => {
    const submittedData = data.formData;
    const configSetting = { config: submittedData };
    kintone.plugin.app.setConfig(
      { config: JSON.stringify(configSetting) },
      function () {
        alert("設定が保存されました。");
        window.location.href = "../../flow?app=" + kintone.app.getId();
      },
    );
  };

  const handleChange = (data: IChangeEvent<any, RJSFSchema, any>) => {
    console.log("change", data);
    const selectedAppId = data.formData?.config?.[0]?.app;
    if (selectedAppId && selectedAppId !== formData?.config?.[0]?.app) {
      handleAppChange(selectedAppId);
    }
    setFormData(data.formData);
    log("changed")(data);
  };

  const dynamicSchema = {
    ...baseSchema,
    properties: {
      ...baseSchema.properties,
      config: {
        ...(typeof baseSchema.properties?.config === "object" &&
        baseSchema.properties.config !== null
          ? (baseSchema.properties.config as JSONSchema7)
          : {}),
        items: {
          type: "object",
          properties: {
            ...(typeof baseSchema.properties?.config === "object" &&
            baseSchema.properties.config.items !== null &&
            (baseSchema.properties.config.items as JSONSchema7).properties
              ? (baseSchema.properties.config.items as JSONSchema7).properties
              : {}),
            app: {
              type: "string",
              oneOf: appOptions,
            },
            mapping: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    oneOf: fieldOptions,
                  },
                  column: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return (
    <Form
      schema={dynamicSchema as RJSFSchema}
      validator={validator}
      onChange={handleChange}
      onSubmit={handleSubmit}
      formData={formData}
      onError={log("errors")}
    />
  );
};

export default App;
