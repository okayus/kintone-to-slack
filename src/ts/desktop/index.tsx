import React from "react";
import { createRoot } from "react-dom/client";

import { DesktopContainer } from "./component/DesktopContainer";

// import type { SavedConfig } from "../common/types";

((PLUGIN_ID) => {
  kintone.events.on(["app.record.index.show"], (event) => {
    const spaceElement = kintone.app.getHeaderMenuSpaceElement();

    if (!spaceElement) return event;

    const divElement = document.createElement("div");
    divElement.style.float = "left";
    divElement.style.marginLeft = "20px";
    divElement.style.marginRight = "20px";
    const root = createRoot(divElement);
    spaceElement.appendChild(divElement);

    root.render(<DesktopContainer pluginId={PLUGIN_ID} />);

    // config.titleに格納されているAPIトークンを使用してSlackにメッセージを送信
    // CORSの制約により、ブラウザから直接Slackにメッセージを送信することはできないためkintoneのapiを使用する実装に変更が必要
    // if (config.title) {
    //   sendSlackMessage(config.title, "テスト");
    // } else {
    //   console.error("APIトークンが設定されていません");
    // }

    return event;
  });
})(kintone.$PLUGIN_ID);
