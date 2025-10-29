"use client";

// import { useEffect, useState } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div id="modal-root" className="relative z-[9999]"></div>
    </>
  );
}
