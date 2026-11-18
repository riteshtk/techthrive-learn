"use client";

// The v1 player and the v2 overview hero share the /topics/[topic] route
// until v1's addresses become redirects (P17). Loading each through
// next/dynamic from a client component gives each its own chunk, so a page
// ships only the one it renders (the JavaScript budget). Both still render
// on the server.

import dynamic from "next/dynamic";

export const LazyV1Player = dynamic(() =>
  import("./Player").then((m) => m.Player),
);

export const LazyHeroDiagram = dynamic(() =>
  import("./HeroDiagram").then((m) => m.HeroDiagram),
);
