import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

(async (PLUGIN_ID) => {
  createRoot(document.getElementById("config")!).render(
    <App pluginId={PLUGIN_ID as string} />,
  );
})(kintone.$PLUGIN_ID);
