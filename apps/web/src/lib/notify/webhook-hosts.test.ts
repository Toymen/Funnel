import { describe, expect, it } from "vitest";

import { isAllowedChatWebhookUrl } from "./webhook-hosts";

describe("isAllowedChatWebhookUrl", () => {
  it("accepts official provider hosts", () => {
    expect(isAllowedChatWebhookUrl("slack", "https://hooks.slack.com/services/T/B/X")).toBe(true);
    expect(isAllowedChatWebhookUrl("discord", "https://discord.com/api/webhooks/1/abc")).toBe(true);
  });

  it("rejects other hosts, http, credentials and lookalikes", () => {
    expect(isAllowedChatWebhookUrl("slack", "https://169.254.169.254/latest")).toBe(false);
    expect(isAllowedChatWebhookUrl("slack", "http://hooks.slack.com/services/x")).toBe(false);
    expect(isAllowedChatWebhookUrl("slack", "https://hooks.slack.com.evil.test/x")).toBe(false);
    expect(isAllowedChatWebhookUrl("discord", "https://user:pw@discord.com/api/webhooks/1")).toBe(false);
    expect(isAllowedChatWebhookUrl("discord", "https://hooks.slack.com/services/x")).toBe(false);
    expect(isAllowedChatWebhookUrl("slack", "not a url")).toBe(false);
  });
});
