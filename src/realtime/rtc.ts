/* Shared WebRTC connection config - imported by BOTH ends of every
   camera call (phone broadcaster + stage CameraWindow). One definition,
   so the two sides can never drift.

   Why TURN: STUN-only hole punching works when both ends share a network
   or sit behind friendly NATs. Cross-network (phone on cellular CGNAT,
   stage on venue WiFi), the media path needs a TURN relay - without one
   ICE freezes at "checking" forever and the stage shows a black screen.

   Configure your own coturn via env (set these on the server so both
   peers pick up the same list):
     NEXT_PUBLIC_TURN_URLS       comma-separated, e.g.
                                 "turn:myapp.up.railway.app:3478,turn:myapp.up.railway.app:443?transport=tcp"
     NEXT_PUBLIC_TURN_USERNAME   turn username
     NEXT_PUBLIC_TURN_CREDENTIAL turn credential

   With no env configured we fall back to the public OpenRelay test relay
   so cross-network rehearsal works out of the box. WARNING: media then
   transits a third party - set your own TURN before any real event. */

const STUN: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"] },
  { urls: ["stun:stun.cloudflare.com:3478"] },
];

const OPENRELAY: RTCIceServer[] = [
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

export function iceServers(): RTCIceServer[] {
  const raw = process.env.NEXT_PUBLIC_TURN_URLS?.trim();
  if (raw) {
    const urls = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (urls.length > 0) {
      return [
        ...STUN,
        {
          urls,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "",
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "",
        },
      ];
    }
  }
  console.warn(
    "[camera] NEXT_PUBLIC_TURN_URLS not set - falling back to the public OpenRelay relay (rehearsal-grade; media relays through a third party). Configure your own TURN for show day."
  );
  return [...STUN, ...OPENRELAY];
}

/* Single shared RTCConfiguration. iceCandidatePoolSize is a constant
   performance win for the frequent re-offer path. */
export const RTC_CFG: RTCConfiguration = {
  iceServers: iceServers(),
  iceCandidatePoolSize: 10,
};
