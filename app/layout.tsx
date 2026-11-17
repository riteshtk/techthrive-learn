import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tech & Thrive Learn",
  description:
    "Free, open-source roadmaps where each idea explains itself as an animated diagram, one step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
