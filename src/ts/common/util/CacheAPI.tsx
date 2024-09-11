import Sdk from "./kintoneSdk";

export interface ParamsToGetRecords {
  app: number;
  condition?: string;
  fields?: string[];
}

export interface ParamsToAddRecords {
  app: number;
  records: any[];
}

interface ParamsToDeleteRecord {
  id: number;
}

export interface ParamsToDeleteRecords {
  app: number;
  records: ParamsToDeleteRecord[];
}

export class CacheAPI {
  private apps: any = [];
  private forms: any = {};

  public async getApps() {
    if (this.apps.length === 0) {
      this.apps = await Sdk.getApps();
    }

    return this.apps;
  }

  public async getFields(appId: number) {
    if (!this.forms[appId]) {
      this.forms[appId] = await Sdk.getFields(appId);
    }
    return this.forms[appId];
  }

  public async getAllRecords(param: ParamsToGetRecords) {
    return Sdk.getAllRecords(param);
  }

  public async addAllRecords(param: ParamsToAddRecords) {
    return Sdk.addAllRecords(param);
  }

  public async deleteAllRecords(param: ParamsToDeleteRecords) {
    return Sdk.deleteAllRecords(param);
  }
}
