"use client";

import { useEffect, useRef } from "react";

type RequestLogCreatedEvent = {
  accepted: number;
  latestCreatedAt: string;
  projectId: string;
};

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

export function useRequestLogEvents(
  onRequestLogCreated: (event: RequestLogCreatedEvent) => void,
  enabled = true
) {
  const callbackRef = useRef(onRequestLogCreated);

  useEffect(() => {
    callbackRef.current = onRequestLogCreated;
  }, [onRequestLogCreated]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let debounceTimer: number | undefined;
    const eventSource = new EventSource(`${apiUrl}/events`, {
      withCredentials: true
    });

    const handleRequestLogCreated = (event: MessageEvent<string>) => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        callbackRef.current(JSON.parse(event.data) as RequestLogCreatedEvent);
      }, 350);
    };

    eventSource.addEventListener(
      "request-log.created",
      handleRequestLogCreated
    );

    return () => {
      window.clearTimeout(debounceTimer);
      eventSource.removeEventListener(
        "request-log.created",
        handleRequestLogCreated
      );
      eventSource.close();
    };
  }, [enabled]);
}
