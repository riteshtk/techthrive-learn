"use client";

// The hero diagram loads through next/dynamic from a client component, so
// it gets its own chunk and pages without it don't ship it (the JavaScript
// budget). It still renders on the server.

import dynamic from "next/dynamic";

export const LazyHeroDiagram = dynamic(() =>
  import("./HeroDiagram").then((m) => m.HeroDiagram),
);
