import type { CrmConnector, CrmLead } from "./types";

// Phase 1 connector. OAuth flow lives in /api/connectors/hubspot/*.
// TODO(claude-code): implement against HubSpot CRM v3 API.
export class HubSpotConnector implements CrmConnector {
  provider = "hubspot";
  constructor(private accessToken: string) {}

  async pullLeads(): Promise<{ leads: CrmLead[]; nextCursor?: string }> {
    throw new Error("not implemented: HubSpot pullLeads");
  }
  async writeActivity(): Promise<void> {
    throw new Error("not implemented: HubSpot writeActivity");
  }
  async updateStatus(): Promise<void> {
    throw new Error("not implemented: HubSpot updateStatus");
  }
}
