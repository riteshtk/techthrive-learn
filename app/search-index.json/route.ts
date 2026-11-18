import { searchDocuments } from "@/content";

// Written once at build time as out/search-index.json. The search dialog
// fetches it the first time it opens (issue #4).
export const dynamic = "force-static";

export function GET() {
  return Response.json(searchDocuments());
}
