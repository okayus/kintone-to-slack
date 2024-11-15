import React from "react";

import { Button, Stack } from "@mui/material";

import { useOnClickButton } from "../hooks/useOnClickButton";

interface AppProps {
  pluginId: string;
}

export const DesktopContainer = (pluginId: AppProps) => {
  const responseConfig = kintone.plugin.app.getConfig(pluginId.pluginId);
  const configs = JSON.parse(responseConfig.config);
  console.log("configs:", configs);
  const { onClickButton, loading } = useOnClickButton(configs[0]);

  return (
    <div>
      <Stack spacing={2} direction="row">
        <Button variant="contained" onClick={() => onClickButton()}>
          一括通知
        </Button>
      </Stack>
    </div>
  );
};
