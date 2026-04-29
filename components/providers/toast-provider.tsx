"use client";

import { ToastContainer, Zoom } from "react-toastify";

export function ToastProvider() {
  return (
    <ToastContainer
      autoClose={5000}
      closeOnClick={false}
      draggable
      hideProgressBar
      newestOnTop={false}
      pauseOnFocusLoss
      pauseOnHover
      position="top-center"
      rtl={false}
      theme="dark"
      transition={Zoom}
    />
  );
}
