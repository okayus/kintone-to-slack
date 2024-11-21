import { describe, expect, it, vi } from "vitest";

import { NotificationManager } from "../../src/desktop/service/NotificationManager";
import { SlackService } from "../../src/desktop/service/SlackService";

const mockSlackService = {} as SlackService;
const mockConfig = {
  slackChannelId: "C123",
  messageTemplate: {
    title: "Notification Title",
    body: "Record: {field1}, {field2}",
    footer: "End of message",
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
      expect(messages[0]).toContain("Notification Title");
      expect(messages[0]).toContain("Record: Value1, Value2");
      expect(messages[0]).toContain("Record: Value3, Value4");
      expect(messages[0]).toContain("End of message");
    });

    it("should split messages that exceed the length limit", () => {
      const longValue = "a".repeat(2930);
      const records = [
        { field1: { value: longValue }, field2: { value: "Value2" } },
        { field1: { value: "Value3" }, field2: { value: "Value4" } },
      ];
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages.length).toBe(2);
      expect(messages[0]).toContain("Notification Title");
      expect(messages[0]).toContain(longValue);
      expect(messages[0]).toContain("End of message");
      expect(messages[1]).toContain("Notification Title");
      expect(messages[1]).toContain("Record: Value3, Value4");
      expect(messages[1]).toContain("End of message");
    });

    it("should replace placeholders with record values", () => {
      const records = [
        { field1: { value: "Value1" }, field2: { value: "Value2" } },
      ];
      const messages = notificationManager.generateMessages(
        records,
        mockConfig.messageTemplate,
      );
      expect(messages[0]).toContain("Record: Value1, Value2");
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
      expect(messages[0]).toContain("Record: Value1, {field2}");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'フィールドコード "field2" の値が見つかりません',
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
