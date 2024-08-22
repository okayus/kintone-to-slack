import React from "react"; // Reactをインポート
import { createRoot } from "react-dom/client";
import App from "./App";

(async (PLUGIN_ID) => {
  createRoot(document.getElementById("root")!).render(
    <App pluginId={PLUGIN_ID} />,
  );
})(kintone.$PLUGIN_ID);
