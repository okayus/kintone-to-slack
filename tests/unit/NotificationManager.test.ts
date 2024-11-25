import { describe, expect, it, vi } from "vitest";

import { NotificationManager } from "../../src/desktop/service/NotificationManager";
import { SlackService } from "../../src/desktop/service/SlackService";

const mockSlackService = {} as SlackService;
const mockConfig = {
  slackChannelId: "C123",
  messageTemplate: {
    title: "Title",
    body: "Record6789{field1}{field2}",
    footer: "End45",
  },
  slackIdField: "slackId",
  notificationLinkField: "notificationLink",
  notificationDateTimeField: "notificationDateTime",
};

describe("NotificationManager", () => {
  const notificationManager = new NotificationManager(
    mockSlackService,
    mockConfig,
  );

  describe("generateMessages", () => {
    it("should return an empty array when no records are provided", () => {
      const messages = notificationManager.generateMessages(
        [],
        mockConfig.messageTemplate,
      );
      expect(messages).toEqual([]);
    });

    it("should generate messages within the length limit", () => {
      const records = [
        { field1: { value: "Value1" }, field2: { value: "Value2" } },
        { field1: { value: "Value3" }, field2: { value: "Value4" } },
      ];
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages.length).toBe(1);
      expect(messages[0]).toContain("Title");
      expect(messages[0]).toContain("Record6789Value1Value2");
      expect(messages[0]).toContain("Record6789Value3Value4");
      expect(messages[0]).toContain("End45");
    });

    it("should split messages when the combined length exceeds the limit", () => {
      const records = Array.from({ length: 200 }, () => ({
        field1: { value: `aaaaa` },
        field2: { value: `bbbbb` },
      }));

      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );

      messages.forEach((message, index) => {
        // メッセージ内でのレコードの一致を検出
        const messageRecords = message.match(/Record6789aaaaabbbbb/g) || [];
        const isLastMessage = index === messages.length - 1;

        // 各部分の長さ
        const titleLength = mockConfig.messageTemplate.title.length; // Title
        const footerLength = mockConfig.messageTemplate.footer.length; // End45
        const recordLength = "Record6789aaaaabbbbb".length + 1; // レコード長 (改行コード込み)
        const maxCharacters = 3000; // 最大文字数

        // 1メッセージに含まれる最大レコード数
        const maxRecordsPerMessage = Math.floor(
          (maxCharacters - titleLength - footerLength) / recordLength,
        );

        // 最後のメッセージでは余りを計算
        const expectedCount = isLastMessage
          ? records.length % maxRecordsPerMessage || maxRecordsPerMessage
          : maxRecordsPerMessage;

        // テスト実行
        expect(messageRecords.length).toBe(expectedCount);
        expect(message).toContain("Title");
        expect(message).toContain("End45");
      });
    });

    it("should replace placeholders with record values", () => {
      const records = [
        { field1: { value: "Value1" }, field2: { value: "Value2" } },
      ];
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages[0]).toContain("Record6789Value1Value2");
    });

    it("should warn if a placeholder value is missing", () => {
      const records = [{ field1: { value: "Value1" } }];
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages[0]).toContain("Record6789Value1{field2}");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'フィールドコード "field2" の値が見つかりません',
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
