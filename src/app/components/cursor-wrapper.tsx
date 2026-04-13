"use client";

import dynamic from "next/dynamic";

const CustomCursor = dynamic(() => import("./custom-cursor"), { ssr: false });

export default function CursorWrapper() {
  return <CustomCursor />;
}
