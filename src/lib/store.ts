import { MeetingRun, TeamMember } from "@/lib/types";

const runs: MeetingRun[] = [];
let directory: TeamMember[] = [];

export function saveRun(run: MeetingRun): void {
  runs.unshift(run);
}

export function listRuns(): MeetingRun[] {
  return runs;
}

export function getRun(id: string): MeetingRun | undefined {
  return runs.find((r) => r.id === id);
}

export function setDirectory(members: TeamMember[]): void {
  directory = members;
}

export function getDirectory(): TeamMember[] {
  return directory;
}
