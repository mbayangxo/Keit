import { Room, RoomEvent, Track, ConnectionState } from 'livekit-client';

/**
 * Web implementation of Mboolo calls on livekit-client. One session per
 * call: connect with the token minted by /api/calls/token, publish mic
 * (and camera for video calls), auto-attach remote audio, and hand video
 * tracks to the screen for rendering.
 */

export const callsSupported = true;

function emitLocalVideo(room, handlers) {
  for (const pub of room.localParticipant.videoTrackPublications.values()) {
    if (pub.track && pub.source === Track.Source.Camera) {
      handlers.onLocalVideoTrack?.(pub.track);
      return;
    }
  }
}

export function createCallSession(handlers = {}) {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const audioEls = [];

  const handleRemoteTrack = (track, participant) => {
    if (participant?.isLocal) return;
    if (track.kind === Track.Kind.Audio) {
      const el = track.attach();
      el.style.display = 'none';
      document.body.appendChild(el);
      audioEls.push(el);
      el.play?.().catch(() => {});
    } else if (track.kind === Track.Kind.Video && track.source === Track.Source.Camera) {
      handlers.onVideoTrack?.(track, participant);
    }
  };

  const notifyCount = () => handlers.onParticipants?.(room.remoteParticipants.size);

  room
    .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => handleRemoteTrack(track, participant))
    .on(RoomEvent.LocalTrackPublished, (pub) => {
      if (pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera && pub.track) {
        handlers.onLocalVideoTrack?.(pub.track);
      }
    })
    .on(RoomEvent.LocalTrackUnpublished, (pub) => {
      if (pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera) {
        handlers.onLocalVideoTrack?.(null);
      }
    })
    .on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
      if (participant?.isLocal) return;
      if (track.kind === Track.Kind.Video && track.source === Track.Source.Camera) {
        handlers.onVideoTrack?.(null, participant);
      }
    })
    .on(RoomEvent.ParticipantConnected, notifyCount)
    .on(RoomEvent.ParticipantDisconnected, notifyCount)
    .on(RoomEvent.Disconnected, () => handlers.onDisconnected?.())
    .on(RoomEvent.ConnectionStateChanged, (state) => {
      if (state === ConnectionState.Disconnected) handlers.onDisconnected?.();
    });

  return {
    async connect(url, token, { video = false } = {}) {
      await room.connect(url, token, { autoSubscribe: true });
      try {
        await room.startAudio();
      } catch {
        /* iOS may require an extra tap — mic publish still works after prejoin gesture */
      }
      await room.localParticipant.setMicrophoneEnabled(true);
      if (video) {
        await room.localParticipant.setCameraEnabled(true);
        emitLocalVideo(room, handlers);
      }
      notifyCount();
      room.remoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (pub.track) handleRemoteTrack(pub.track, p);
        });
      });
    },
    setMic: (on) => room.localParticipant.setMicrophoneEnabled(on),
    async setCamera(on) {
      await room.localParticipant.setCameraEnabled(on);
      if (on) emitLocalVideo(room, handlers);
      else handlers.onLocalVideoTrack?.(null);
    },
    localVideoTrack() {
      for (const pub of room.localParticipant.videoTrackPublications.values()) {
        if (pub.track && pub.source === Track.Source.Camera) return pub.track;
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
