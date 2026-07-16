import { Room, RoomEvent, Track } from 'livekit-client';

/**
 * Web implementation of Mboolo calls on livekit-client. One session per
 * call: connect with the token minted by /api/calls/token, publish mic
 * (and camera for video calls), auto-attach remote audio, and hand video
 * tracks to the screen for rendering.
 */

export const callsSupported = true;

export function createCallSession(handlers = {}) {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const audioEls = [];

  const handleTrack = (track, participant) => {
    if (track.kind === Track.Kind.Audio) {
      const el = track.attach();
      el.style.display = 'none';
      document.body.appendChild(el);
      audioEls.push(el);
    } else if (track.kind === Track.Kind.Video) {
      handlers.onVideoTrack?.(track, participant);
    }
  };

  const notifyCount = () => handlers.onParticipants?.(room.remoteParticipants.size);

  room
    .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => handleTrack(track, participant))
    .on(RoomEvent.ParticipantConnected, notifyCount)
    .on(RoomEvent.ParticipantDisconnected, notifyCount)
    .on(RoomEvent.Disconnected, () => handlers.onDisconnected?.());

  return {
    async connect(url, token, { video = false } = {}) {
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      if (video) await room.localParticipant.setCameraEnabled(true);
      notifyCount();
      room.remoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (pub.track) handleTrack(pub.track, p);
        });
      });
    },
    setMic: (on) => room.localParticipant.setMicrophoneEnabled(on),
    setCamera: (on) => room.localParticipant.setCameraEnabled(on),
    localVideoTrack() {
      for (const pub of room.localParticipant.videoTrackPublications.values()) {
        if (pub.track) return pub.track;
      }
      return null;
    },
    disconnect() {
      audioEls.forEach((el) => el.remove());
      audioEls.length = 0;
      room.disconnect();
    },
  };
}
