"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type * as React from "react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

export function PHProvider({ children }: React.PropsWithChildren) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
