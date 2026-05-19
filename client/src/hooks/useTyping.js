import { useRef, useCallback } from "react";

/**
 * Emits typing / stopTyping socket events with a debounced stop.
 * @param {object} socket  - Socket.IO client instance
 * @param {string} toUserId - Recipient user ID
 * @param {number} delay   - ms of inactivity before stopTyping fires (default 1500)
 */
export function useTyping(socket, toUserId, delay = 1500) {
  const timer = useRef(null);

  const onType = useCallback(() => {
    if (!socket || !toUserId) return;
    socket.emit("typing", { toUserId });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      socket.emit("stopTyping", { toUserId });
    }, delay);
  }, [socket, toUserId, delay]);

  const stopTyping = useCallback(() => {
    if (!socket || !toUserId) return;
    clearTimeout(timer.current);
    socket.emit("stopTyping", { toUserId });
  }, [socket, toUserId]);

  return { onType, stopTyping };
}
