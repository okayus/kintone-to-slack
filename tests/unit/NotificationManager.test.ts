import { describe, expect, it, vi } from "vitest";

import { NotificationManager } from "../../src/desktop/service/NotificationManager";
import { SlackService } from "../../src/desktop/service/SlackService";
import { KintoneSdk } from "../../src/shared/util/kintoneSdk";

import type { ConfigSchema } from "../../src/shared/types/Config";

const mockSlackService = {} as SlackService;
const mockConfig = {
  recordListId: "1",
  slackChannelId: "C123",
  messageTemplate: {
    title: "Notification Title",
    body: "Record: {field1}, {field2}",
    footer: "End of message",
  },
  slackIdField: ["slackId"],
  notificationLinkField: "notificationLink",
  notificationDateTimeField: "notificationDateTime",
} as ConfigSchema["notificationSettings"][number];
const mockkintoneSdk = {} as KintoneSdk;

describe("NotificationManager", () => {
  const notificationManager = new NotificationManager(
    mockSlackService,
    mockConfig,
    mockkintoneSdk,
  );

  describe("generateMessages", () => {
    it("レコードが空の場合、空の配列を返す", () => {
      const messages = notificationManager.generateMessages(
        [],
        mockConfig.messageTemplate,
      );
      expect(messages).toEqual([]);
    });

    it("文字数制限内でメッセージを生成する", () => {
      const records = [
        { field1: { value: "Value1" }, field2: { value: "Value2" } },
        { field1: { value: "Value3" }, field2: { value: "Value4" } },
      ];
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages.length).toBe(1);
      expect(messages[0]).toContain("Notification Title");
      expect(messages[0]).toContain("Record: Value1, Value2");
      expect(messages[0]).toContain("Record: Value3, Value4");
      expect(messages[0]).toContain("End of message");
    });

    it("メッセージの合計文字数が制限を超える場合、分割する", () => {
      const records = Array.from({ length: 200 }, () => ({
        field1: { value: `aaaaa` },
        field2: { value: `bbbbb` },
      }));

      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );

      messages.forEach((message, index) => {
        const messageRecords = message.match(/Record:/g) || [];
        const isLastMessage = index === messages.length - 1;

        const titleLength = mockConfig.messageTemplate.title.length;
        const footerLength = mockConfig.messageTemplate.footer.length;
        const recordLength = "Record: aaaaa, bbbbb".length + 1;
        const maxCharacters = 3000;

        const maxRecordsPerMessage = Math.floor(
          (maxCharacters - titleLength - footerLength) / recordLength,
        );

        const expectedCount = isLastMessage
          ? (records.length % maxRecordsPerMessage) + 1 || maxRecordsPerMessage
          : maxRecordsPerMessage - 1;

        expect(messageRecords.length).toBe(expectedCount);
        expect(message).toContain("Notification Title");
        expect(message).toContain("End of message");
      });
    });

    it("プレースホルダーをレコード値に置き換える", () => {
      const records = [
        { field1: { value: "Value1" }, field2: { value: "Value2" } },
      ];
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages[0]).toContain("Record: Value1, Value2");
    });

    it("プレースホルダーの値が不足している場合、警告を出す", () => {
      const records = [{ field1: { value: "Value1" } }];
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages[0]).toContain("Record: Value1, {field2}");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'フィールドコード "field2" の値が見つかりません',
      );
      consoleWarnSpy.mockRestore();
    });

    it("footerがundefinedの場合、headerとbodyのみでメッセージを生成する", () => {
      const records = [
        { field1: { value: "Value1" }, field2: { value: "Value2" } },
      ];
      const customTemplate = {
        ...mockConfig.messageTemplate,
        footer: undefined,
      };

      const messages = notificationManager.generateMessages(
        records,
        customTemplate,
      );

      expect(messages.length).toBe(1);
      expect(messages[0]).toContain("Notification Title");
      expect(messages[0]).toContain("Record: Value1, Value2");
      expect(messages[0]).not.toContain("End of message");
    });
  });
});
