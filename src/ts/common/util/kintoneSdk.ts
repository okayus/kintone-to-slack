import {
  KintoneRestAPIClient,
  KintoneFormFieldProperty,
} from "@kintone/rest-api-client";

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

export class KintoneUrlUtil {
  // private fields: Record<string, KintoneFormFieldProperty.OneOf> = {};

  public getRestApiClient(): KintoneRestAPIClient {
    return new KintoneRestAPIClient({});
  }

  public fetchFields = async (appId: number, preview: boolean = true) => {
    const restApiClient = this.getRestApiClient();
    const fields = (
      await restApiClient.app.getFormFields({ app: appId, preview })
    ).properties;
    return fields;
  };

  public getApps = async () => {
    const restApiClient = this.getRestApiClient();
    return restApiClient.app.getApps({});
  };

  public getAllRecords = async (param: ParamsToGetRecords) => {
    const restApiClient = this.getRestApiClient();
    return restApiClient.record.getAllRecords(param);
  };

  public addAllRecords = async (param: ParamsToAddRecords) => {
    const restApiClient = this.getRestApiClient();
    const resp = await restApiClient.record.addAllRecords(param);
    return resp;
  };

  public deleteAllRecords = async (param: ParamsToDeleteRecords) => {
    const restApiClient = this.getRestApiClient();
    const resp = await restApiClient.record.deleteAllRecords(param);
    return resp;
  };

  public addRecord = async (param: any) => {
    const restApiClient = this.getRestApiClient();
    const resp = await restApiClient.record.addRecord(param);
    return resp;
  };

  public updateRecord = async (param: any) => {
    const restApiClient = this.getRestApiClient();
    const resp = await restApiClient.record.updateRecord(param);
    return resp;
  };
}

export class Sdk {
  private kintoneUrlUtil: KintoneUrlUtil;

  constructor() {
    this.kintoneUrlUtil = new KintoneUrlUtil();
  }

  public async getApps() {
    return this.kintoneUrlUtil.getApps();
  }

  public async getFields(appId: number) {
    const res = await this.kintoneUrlUtil.fetchFields(appId);
    return res;
  }

  public async getAllRecords(param: ParamsToGetRecords) {
    return this.kintoneUrlUtil.getAllRecords(param);
  }

  public async addAllRecords(param: ParamsToAddRecords) {
    return this.kintoneUrlUtil.addAllRecords(param);
  }

  public async deleteAllRecords(param: ParamsToDeleteRecords) {
    return this.kintoneUrlUtil.deleteAllRecords(param);
  }

  public async addRecord(param: any) {
    return this.kintoneUrlUtil.addRecord(param);
  }

  public async updateRecord(param: any) {
    return this.kintoneUrlUtil.updateRecord(param);
  }
}

export default new Sdk();

export type kintoneType = KintoneFormFieldProperty.OneOf["type"];
