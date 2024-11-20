import Sdk from "./kintoneSdk";

import type { Properties } from "@kintone/rest-api-client/lib/src/client/types";

export class CacheAPI {
  private forms: { [appId: number]: Properties } = {};

  public async getFields(appId: number | null) {
    if (appId === null) {
      return {};
    }

    if (!this.forms[appId]) {
      this.forms[appId] = await Sdk.getFields(appId);
    }
    return this.forms[appId];
  }
}
