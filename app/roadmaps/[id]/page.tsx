import type { Metadata } from "next";
import { Redirect } from "@/components/Redirect";

// v1's one roadmap is now the Foundations topic (P17).
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "ai-system-design" }];
}

export const metadata: Metadata = {
  title: "AI System Design has moved",
  robots: { index: false },
};

export default function MovedRoadmap() {
  return <Redirect to="/topics/foundations/" title="AI System Design" />;
}
