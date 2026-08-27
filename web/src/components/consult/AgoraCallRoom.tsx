"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  User,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TokenPayload = {
  appId: string;
  token: string | null;
  channelName: string;
  uid: number;
  consultType: "VIDEO" | "AUDIO";
  patientName: string;
  doctorName: string;
  consultNumber: string;
};

type AgoraCallRoomProps = {
  consultationId: string;
  role: "patient" | "doctor";
  onCallEnd?: () => void;
  className?: string;
};

export function AgoraCallRoom({
  consultationId,
  role,
  onCallEnd,
  className,
}: AgoraCallRoomProps) {
  const localHostRef = useRef<HTMLDivElement>(null);
  const remoteHostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localTracksRef = useRef<any[]>([]);
  const joinedRef = useRef(false);
  const mountedRef = useRef(true);

  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<TokenPayload | null>(null);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [audioOnly, setAudioOnly] = useState(false);
  const [debug, setDebug] = useState("");

  const cleanup = useCallback(async () => {
    try {
      for (const track of localTracksRef.current) {
        try {
          track.stop?.();
          track.close?.();
        } catch {
          /* ignore */
        }
      }
      localTracksRef.current = [];
      if (clientRef.current) {
        try {
          clientRef.current.removeAllListeners?.();
        } catch {
          /* ignore */
        }
        if (joinedRef.current) {
          try {
            await clientRef.current.leave();
          } catch {
            /* ignore */
          }
          joinedRef.current = false;
        }
      }
      clientRef.current = null;
      if (remoteHostRef.current) remoteHostRef.current.innerHTML = "";
      if (localHostRef.current) localHostRef.current.innerHTML = "";
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let resubTimer: ReturnType<typeof setInterval> | undefined;

    async function start() {
      setConnecting(true);
      setError(null);
      setRemoteJoined(false);
      setRemoteHasVideo(false);
      setDebug("");

      try {
        const res = await apiFetch("/agora/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consultationId, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Token failed");
        if (!mountedRef.current) return;

        setMeta(data as TokenPayload);
        const isAudio = data.consultType === "AUDIO";
        setAudioOnly(isAudio);
        setCamOn(!isAudio);

        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(3);

        // Ensure previous client is gone
        await cleanup();

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const playRemote = (user: any) => {
          const el = remoteHostRef.current;
          if (!el) return;
          if (user.videoTrack) {
            try {
              user.videoTrack.play(el, { fit: "cover" });
              setRemoteHasVideo(true);
              setRemoteJoined(true);
              setDebug((d) => d + `|rv:${user.uid}`);
            } catch (e) {
              console.error("remote video play", e);
            }
          }
          if (user.audioTrack) {
            try {
              user.audioTrack.play();
              setRemoteJoined(true);
            } catch (e) {
              console.error("remote audio play", e);
            }
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscribeUser = async (user: any, mediaType?: "audio" | "video") => {
          try {
            if (mediaType) {
              await client.subscribe(user, mediaType);
              if (mediaType === "video" || mediaType === "audio") {
                playRemote(user);
              }
              return;
            }
            // subscribe both if available
            if (user.hasVideo || user._video_added_ || user.videoTrack) {
              await client.subscribe(user, "video");
            }
            if (user.hasAudio || user._audio_added_ || user.audioTrack) {
              await client.subscribe(user, "audio");
            }
            playRemote(user);
          } catch (e) {
            console.error("subscribe failed", mediaType, e);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const syncAllRemotes = async () => {
          const users = client.remoteUsers || [];
          setDebug(`remotes:${users.length}`);
          for (const user of users) {
            // Always try subscribe — safe if already subscribed
            try {
              if (user.hasVideo) {
                await client.subscribe(user, "video");
              }
              if (user.hasAudio) {
                await client.subscribe(user, "audio");
              }
            } catch {
              /* may already be subscribed */
            }
            playRemote(user);
          }
          if (users.length > 0) setRemoteJoined(true);
        };

        client.on("user-published", async (user, mediaType) => {
          setDebug((d) => d + `|pub:${user.uid}:${mediaType}`);
          await subscribeUser(user, mediaType as "audio" | "video");
        });

        client.on("user-joined", async (user) => {
          setDebug((d) => d + `|join:${user.uid}`);
          setRemoteJoined(true);
          // Small delay then sync tracks
          setTimeout(() => void syncAllRemotes(), 300);
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            setRemoteHasVideo(false);
            if (remoteHostRef.current) remoteHostRef.current.innerHTML = "";
          }
        });

        client.on("user-left", () => {
          setRemoteJoined(false);
          setRemoteHasVideo(false);
          if (remoteHostRef.current) remoteHostRef.current.innerHTML = "";
        });

        const uid = Number(data.uid);
        await client.join(
          String(data.appId),
          String(data.channelName),
          data.token ? String(data.token) : null,
          uid
        );
        joinedRef.current = true;
        setDebug(`joined:${uid}:ch=${data.channelName}`);

        // Immediately pick up peer already in channel
        await syncAllRemotes();

        // Local tracks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tracks: any[] = [];
        const micTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true,
          ANS: true,
        });
        tracks.push(micTrack);

        if (!isAudio) {
          const camTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "480p_1",
            facingMode: "user",
          });
          tracks.push(camTrack);
          if (localHostRef.current) {
            camTrack.play(localHostRef.current, { fit: "cover", mirror: true });
          }
        }

        localTracksRef.current = tracks;

        // Publish tracks one-by-one (more reliable than batch on some browsers)
        for (const t of tracks) {
          await client.publish([t]);
        }
        setDebug((d) => d + `|pubLocal:${tracks.length}`);

        // Keep trying to attach remote for a while (doctor joins late / event race)
        await syncAllRemotes();
        resubTimer = setInterval(() => {
          if (!mountedRef.current || !clientRef.current) return;
          void syncAllRemotes();
        }, 1500);

        if (mountedRef.current) {
          setConnecting(false);
          timer = setInterval(() => setElapsed((e) => e + 1), 1000);
        }
      } catch (e) {
        console.error(e);
        if (mountedRef.current) {
          setError(
            e instanceof Error
              ? e.message
              : "Could not start call. Allow camera & mic."
          );
          setConnecting(false);
        }
      }
    }

    void start();

    return () => {
      mountedRef.current = false;
      if (timer) clearInterval(timer);
      if (resubTimer) clearInterval(resubTimer);
      void cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, role]);

  async function toggleMic() {
    const mic = localTracksRef.current.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.trackMediaType === "audio"
    );
    if (!mic) return;
    const next = !micOn;
    await mic.setEnabled(next);
    setMicOn(next);
  }

  async function toggleCam() {
    if (audioOnly) return;
    const cam = localTracksRef.current.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.trackMediaType === "video"
    );
    if (!cam) return;
    const next = !camOn;
    await cam.setEnabled(next);
    setCamOn(next);
  }

  async function endCall() {
    await cleanup();
    try {
      await apiFetch(`/consultations/${consultationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
    } catch {
      /* ignore */
    }
    onCallEnd?.();
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const clock = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const peerLabel =
    role === "doctor"
      ? meta?.patientName || "Patient"
      : meta?.doctorName || "Doctor";
  const selfLabel = role === "doctor" ? "You (Doctor)" : "You";

  return (
    <div
      className={cn(
        "relative flex min-h-[480px] flex-col overflow-hidden rounded-2xl bg-[var(--forest-deep)] text-white shadow-2xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {meta?.consultNumber || "Connecting…"}
          </p>
          <p className="text-xs text-white/60">
            {audioOnly ? "Audio" : "Video"} · {peerLabel} ·{" "}
            {role === "doctor" ? "Doctor" : "Patient"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              remoteJoined
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/20 text-amber-200"
            )}
          >
            {remoteJoined
              ? remoteHasVideo || audioOnly
                ? "Peer connected"
                : "Peer audio"
              : "Waiting for peer…"}
          </span>
          <span className="font-mono text-sm tabular-nums text-white/80">
            {clock}
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 bg-[#061816] p-3">
        {connecting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[var(--forest-deep)]/90">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--gold)]" />
            <p className="text-sm text-white/80">Connecting…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-semibold text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* REMOTE — full area, empty host for SDK */}
        <div className="relative min-h-[320px] w-full flex-1 overflow-hidden rounded-xl bg-black">
          <div
            ref={remoteHostRef}
            id={`agora-remote-${role}`}
            className="absolute inset-0 z-[1] h-full w-full"
            style={{ minHeight: 320 }}
          />
          {!remoteJoined && !connecting && !error && (
            <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 text-white/50">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <User className="h-10 w-10" />
              </div>
              <p className="text-sm">Waiting for {peerLabel}…</p>
              <p className="max-w-xs text-center text-[11px] text-white/35">
                Keep this page open. When they join, their video appears here.
              </p>
            </div>
          )}
          {audioOnly && remoteJoined && (
            <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--gold)]/20 ring-4 ring-[var(--gold)]/30">
                <User className="h-12 w-12 text-[var(--gold)]" />
              </div>
              <p className="text-sm font-semibold">{peerLabel}</p>
            </div>
          )}
          <span className="absolute bottom-3 left-3 z-[3] rounded bg-black/60 px-2 py-0.5 text-[11px]">
            {peerLabel}
          </span>
        </div>

        {/* LOCAL PiP */}
        {!audioOnly && (
          <div className="absolute bottom-5 right-5 z-10 h-36 w-28 overflow-hidden rounded-xl border-2 border-white/30 bg-black shadow-xl sm:h-44 sm:w-32">
            <div
              ref={localHostRef}
              id={`agora-local-${role}`}
              className="absolute inset-0 h-full w-full"
            />
            {!camOn && (
              <div className="absolute inset-0 z-[1] flex items-center justify-center bg-[var(--forest)]">
                <VideoOff className="h-6 w-6 text-white/60" />
              </div>
            )}
            <span className="absolute bottom-1 left-1 z-[2] rounded bg-black/60 px-1 text-[9px]">
              {selfLabel}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-4">
        <button
          type="button"
          onClick={() => void toggleMic()}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            micOn ? "bg-white/15" : "bg-red-500"
          )}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        {!audioOnly && (
          <button
            type="button"
            onClick={() => void toggleCam()}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              camOn ? "bg-white/15" : "bg-red-500"
            )}
          >
            {camOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => void endCall()}
          className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-bold"
        >
          <PhoneOff className="h-5 w-5" /> End
        </button>
        <button
          type="button"
          onClick={() => {
            const el = remoteHostRef.current?.parentElement;
            if (el && "requestFullscreen" in el) {
              void (el as HTMLElement).requestFullscreen?.();
            }
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>

      {process.env.NODE_ENV !== "production" && debug && (
        <p className="truncate px-3 pb-2 text-[9px] text-white/30">{debug}</p>
      )}
    </div>
  );
}
