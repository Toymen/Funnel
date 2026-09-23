import type { ChatProviderId } from "@/lib/notify/config";

/** Offizielle Webhook-Hosts je Chat-Anbieter. */
export const CHAT_WEBHOOK_HOSTS: Record<ChatProviderId, readonly string[]> = {
  slack: ["hooks.slack.com"],
  discord: ["discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com"],
};

/**
 * Prüft eine Chat-Webhook-URL gegen die Allowlist. Wird beim Speichern UND
 * vor jedem Versand aufgerufen, damit auch ältere oder direkt in der Datenbank
 * geänderte Einträge keine beliebigen Ziele erreichen (SSRF).
 */
export function isAllowedChatWebhookUrl(provider: ChatProviderId, url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      CHAT_WEBHOOK_HOSTS[provider].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}
