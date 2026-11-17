import type { Metadata } from "next";
import { absoluteUrl } from "./paths";

export const SITE_NAME = "Tech & Thrive Learn";
export const SITE_DESCRIPTION =
  "Free, open-source roadmaps where each idea explains itself as an animated diagram, one step at a time.";

/** Title, description, canonical URL and the share image for one page. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description: string;
  path: string;
}): Metadata {
  const url = absoluteUrl(path);
  const image = {
    url: absoluteUrl("/og.png"),
    width: 1200,
    height: 630,
    alt: SITE_NAME,
  };
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: title ?? SITE_NAME,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? SITE_NAME,
      description,
      images: [image.url],
    },
  };
}
