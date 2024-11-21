import {
  KintoneFormFieldProperty,
  KintoneRestAPIClient,
} from "@kintone/rest-api-client";

export class KintoneUrlUtil {
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

  public getViews = async (appId: number) => {
    const restApiClient = this.getRestApiClient();
    const views = await restApiClient.app.getViews({ app: appId });
    return views;
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

  public updateRecord = async (
    appId: number,
    recordId: number,
    record: Record<string, any>,
  ) => {
    const restApiClient = this.getRestApiClient();
    const res = await restApiClient.record.updateRecord({
      app: appId,
      id: recordId,
      record: record,
    });
    return res;
  };
}

export class Sdk {
  private kintoneUrlUtil: KintoneUrlUtil;

  constructor() {
    this.kintoneUrlUtil = new KintoneUrlUtil();
  }

  public async getFields(appId: number) {
    const res = await this.kintoneUrlUtil.fetchFields(appId);
    return res;
  }

  public async getViews(appId: number) {
    const res = await this.kintoneUrlUtil.getViews(appId);
    return res;
  }

  public async getRecords(appId: number, fields: string[], query: string) {
    const res = await this.kintoneUrlUtil.getRecords(appId, fields, query);
    return res;
  }

  public async updateRecord(
    appId: number,
    recordId: number,
    record: Record<string, any>,
  ) {
    const res = await this.kintoneUrlUtil.updateRecord(appId, recordId, record);
    return res;
  }
}

export default new Sdk();

export type kintoneType = KintoneFormFieldProperty.OneOf["type"];
