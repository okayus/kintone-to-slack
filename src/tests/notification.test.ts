import { describe, expect, it, vi } from "vitest";

import { SlackService } from "../ts/desktop/service/SlackService";

global.fetch = vi.fn();

describe("SlackService", () => {
  const botToken = "fake-token";
  const service = new SlackService(botToken);

  it("should fetch channel members", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ ok: true, members: ["U123", "U456"] }),
    });

    const members = await service.getChannelMembers("C123");
    expect(members).toEqual(["U123", "U456"]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("conversations.members"),
      expect.anything(),
    );
  });

  it("should throw error if fetching channel members fails", async () => {
    fetch.mockResolvedValueOnce({ json: async () => ({ ok: false }) });

    await expect(service.getChannelMembers("C123")).rejects.toThrow(
      "Failed to fetch channel members",
    );
  });

  it("should invite members to a channel", async () => {
    fetch.mockResolvedValueOnce({ json: async () => ({ ok: true }) });

    await service.inviteMembersToChannel("C123", ["U789"]);
    expect(fetch).toHaveBeenCalledWith(
      "https://slack.com/api/conversations.invite",
      expect.anything(),
    );
  });

  it("should skip inviting if no users are provided", async () => {
    await service.inviteMembersToChannel("C123", []);
    expect(fetch).not.toHaveBeenCalled();
  });
});
