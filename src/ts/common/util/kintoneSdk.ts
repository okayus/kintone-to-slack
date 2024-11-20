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

  public async getFields(appId: number) {
    const res = await this.kintoneUrlUtil.fetchFields(appId);
    return res;
  }

  public async getRecords(appId: number, fields: string[], query: string) {
    const res = await this.kintoneUrlUtil.getRecords(appId, fields, query);
    return res;
  }
}

export default new Sdk();

export type kintoneType = KintoneFormFieldProperty.OneOf["type"];
