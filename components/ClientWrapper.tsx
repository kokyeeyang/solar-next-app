"use client";

import { useEffect, useState } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <>
      {children}
      {hasMounted && <div id="modal-root" className="relative z-[9999]"></div>}
    </>
  );
}
