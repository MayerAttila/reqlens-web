"use client";

import { ToastContainer } from "react-toastify";

export function ToastProvider() {
  return (
    <ToastContainer
      autoClose={3200}
      closeOnClick
      draggable
      newestOnTop
      pauseOnFocusLoss={false}
      position="top-right"
      theme="dark"
    />
  );
}
