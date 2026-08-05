import { Dropbox } from 'dropbox';

class PowerAutomateService {
  async uploadTicketFile(ticket) {
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });
    const fileName = `ticket-${Date.now()}.json`;
    try {
      await dbx.filesUpload({
        path: `/support-tickets/${fileName}`,
        contents: JSON.stringify(ticket, null, 2),
        mode: { '.tag': 'add' },
        autorename: true,
      });
    } catch (e) {
      console.log(`Something went wrong ${e}`);
    }


    return fileName;
  }
}

export default new PowerAutomateService();
