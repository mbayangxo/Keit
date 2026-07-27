import { useEffect, useState } from 'react';
import { View } from 'react-native';

/** Resolve the DOM host node from a React Native Web View ref. */
function resolveDomHost(node) {
  if (!node) return null;
  if (typeof node.appendChild === 'function') return node;
  const nested = node._node ?? node.node ?? node.element;
  if (nested && typeof nested.appendChild === 'function') return nested;
  return null;
}

/**
 * Mounts a LiveKit video track into a RN Web View. Keeps attach/detach in
 * sync when the track changes or the component unmounts.
 */
export default function CallVideoView({ track, mirrored = false, style }) {
  const [hostNode, setHostNode] = useState(null);

  useEffect(() => {
    const host = resolveDomHost(hostNode);
    if (!host || !track) return undefined;

    const el = track.attach();
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'cover';
    el.style.display = 'block';
    el.style.backgroundColor = '#000';
    if (mirrored) el.style.transform = 'scaleX(-1)';

    if (typeof host.replaceChildren === 'function') {
      host.replaceChildren(el);
    } else {
      while (host.firstChild) host.removeChild(host.firstChild);
      host.appendChild(el);
    }

    return () => {
      try {
        track.detach(el);
      } catch {
        /* ignore */
      }
      if (typeof host.replaceChildren === 'function') host.replaceChildren();
    };
  }, [hostNode, track, mirrored]);

  return <View ref={setHostNode} style={style} collapsable={false} />;
}
