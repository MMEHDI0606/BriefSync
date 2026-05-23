import { TeamMember } from "@/lib/types";

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function jaroSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (!matches) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }

  const transpositions = t / 2;
  return (
    matches / a.length +
    matches / b.length +
    (matches - transpositions) / matches
  ) / 3;
}

export function resolveTeamMember(name: string, directory: TeamMember[]): TeamMember | null {
  const n = normalize(name);
  let best: { score: number; member: TeamMember | null } = { score: 0, member: null };

  for (const member of directory) {
    const all = [member.name, ...member.aliases].map(normalize).filter(Boolean);
    for (const candidate of all) {
      if (candidate === n) return member;
      if (candidate.startsWith(n) || n.startsWith(candidate)) {
        if (best.score < 0.9) best = { score: 0.9, member };
      }

      const score = jaroSimilarity(candidate, n);
      if (score > best.score) {
        best = { score, member };
      }
    }
  }

  return best.score >= 0.85 ? best.member : null;
}

export function parseDirectoryCsv(csv: string): TeamMember[] {
  const rows = csv.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  if (rows.length <= 1) return [];

  const body = rows.slice(1);
  return body
    .map((line) => {
      const [name, aliasesRaw, slackId, notionUserId] = line.split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
      if (!name || !slackId) return null;

      const aliases = aliasesRaw ? aliasesRaw.split(/[;|]/).map((a) => a.trim()).filter(Boolean) : [];
      return {
        name,
        aliases,
        slack_id: slackId,
        notion_user_id: notionUserId || null,
      };
    })
    .filter((item): item is TeamMember => Boolean(item));
}
