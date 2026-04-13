"use client";

import dynamic from "next/dynamic";
import { useA11y } from "./accessibility-provider";

const MeshBackground = dynamic(() => import("./mesh-background"), {
  ssr: false,
});

export default function BackgroundWrapper() {
  const { reduceMotion } = useA11y();
  if (reduceMotion) return null;
  return <MeshBackground />;
}
