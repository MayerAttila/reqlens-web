"use client";

import { createAuthClient } from "better-auth/react";

const apiUrl = process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: apiUrl
});
