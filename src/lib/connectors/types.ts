// Connector abstraction so HubSpot (Phase 1), Zoho, etc. are interchangeable.
export interface CrmLead {
  crmId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  history?: unknown;
}

export interface CrmConnector {
  provider: string;
  pullLeads(opts: { since?: Date; cursor?: string }): Promise<{ leads: CrmLead[]; nextCursor?: string }>;
  writeActivity(crmId: string, activity: { type: string; body: string; at: Date }): Promise<void>;
  updateStatus(crmId: string, status: string): Promise<void>;
}
