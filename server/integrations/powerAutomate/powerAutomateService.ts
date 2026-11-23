import { Dropbox } from 'dropbox';

export interface SupportTicket {
  reportedBy: string;
  position: string | null;
  link: string;
  priority: string;
  summary: string;
  adminEmails: string[];
}

class PowerAutomateService {
  async uploadTicketFile(ticket: SupportTicket) {
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });
    const fileName = `ticket-${Date.now()}.json`;
    await dbx.filesUpload({
      path: `/support-tickets/${fileName}`,
      contents: JSON.stringify(ticket, null, 2),
      mode: { '.tag': 'add' },
      autorename: true,
    });

    return fileName;
  }
}

export default new PowerAutomateService();
