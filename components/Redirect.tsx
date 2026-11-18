// A v1 address that moved (PRD P17). Static hosting has no server
// redirects, so the page sends the browser on three ways: a meta refresh
// (React places it in the head), a script that keeps ?step and the hash,
// and a visible link for anything that runs neither.

import { withBase } from "@/lib/paths";

export function Redirect({ to, title }: { to: string; title: string }) {
  const target = withBase(to);
  return (
    <main className="tt-redirect">
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `location.replace(${JSON.stringify(target)}+location.search+location.hash)`,
        }}
      />
      <h1 className="tt-h2">{title} has moved</h1>
      <p className="tt-body">
        It’s now part of Foundations, rebuilt in the new lesson design.{" "}
        <a href={target}>Go to its new page</a>.
      </p>
    </main>
  );
}
