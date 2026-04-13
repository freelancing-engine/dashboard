"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function GsapRegistration() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  return null;
}
