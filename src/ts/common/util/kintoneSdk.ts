import {
  KintoneFormFieldProperty,
  KintoneRestAPIClient,
} from "@kintone/rest-api-client";

export class KintoneUrlUtil {
  // private fields: Record<string, KintoneFormFieldProperty.OneOf> = {};
  public getApps = async () => {
    const restApiClient = this.getRestApiClient();
    return restApiClient.app.getApps({});
  };

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

  public getFormLayout = async (appId: number, preview: boolean = true) => {
    const restApiClient = this.getRestApiClient();
    const formLayout = (
      await restApiClient.app.getFormLayout({ app: appId, preview })
    ).layout;
    return formLayout;
  };

  public getRecords = async (
    appId: number,
    fields: string[],
    query: string,
    totalCount: boolean = false,
  ) => {
    const restApiClient = this.getRestApiClient();
    const records = await restApiClient.record.getRecords({
      app: appId,
      fields: fields,
      query: query,
      totalCount: totalCount,
    });
    return records;
  };
}

export class Sdk {
  private kintoneUrlUtil: KintoneUrlUtil;

  constructor() {
    this.kintoneUrlUtil = new KintoneUrlUtil();
  }

  public async getApps() {
    const res = await this.kintoneUrlUtil.getApps();
    return res;
  }

  public async getFields(appId: number) {
    const res = await this.kintoneUrlUtil.fetchFields(appId);
    return res;
  }

  public async getFormLayout(appId: number) {
    const res = await this.kintoneUrlUtil.getFormLayout(appId);
    return res;
  }

  public async getRecords(appId: number, fields: string[], query: string) {
    const res = await this.kintoneUrlUtil.getRecords(appId, fields, query);
    return res;
  }
}

export default new Sdk();

export type kintoneType = KintoneFormFieldProperty.OneOf["type"];
