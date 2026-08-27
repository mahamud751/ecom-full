import { RtcRole, RtcTokenBuilder } from "agora-token";

export function getAgoraAppId(): string {
  const appId = process.env.AGORA_APP_ID;
  if (!appId) {
    throw new Error("AGORA_APP_ID is not configured");
  }
  return appId;
}

export function getAgoraCertificate(): string | null {
  return process.env.AGORA_APP_CERTIFICATE || null;
}

/**
 * Build RTC token.
 * IMPORTANT: agora-token v2 expects tokenExpire / privilegeExpire as
 * **seconds from now** (e.g. 7200), NOT absolute unix timestamps.
 */
export function buildRtcToken(params: {
  channelName: string;
  uid: number | string;
  role?: "publisher" | "subscriber";
  expireSeconds?: number;
}): { token: string | null; appId: string; expireAt: number } {
  const appId = getAgoraAppId();
  const certificate = getAgoraCertificate();
  const expireSeconds = params.expireSeconds ?? 7200;
  const expireAt = Math.floor(Date.now() / 1000) + expireSeconds;
  const role =
    params.role === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

  if (!certificate) {
    return { token: null, appId, expireAt };
  }

  const uid =
    typeof params.uid === "number"
      ? params.uid
      : Number.parseInt(String(params.uid), 10) || 0;

  // Duration-based expire (see agora-token RtcTokenBuilder2 docs)
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    certificate,
    params.channelName,
    uid,
    role,
    expireSeconds,
    expireSeconds,
  );

  return { token, appId, expireAt };
}

export function makeChannelName(consultNumber: string): string {
  const safe = consultNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `htp_${safe}`.slice(0, 64);
}
