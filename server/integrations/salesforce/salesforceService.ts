import axios from 'axios';
import jsforce, { type Connection } from 'jsforce';

export interface SalesforceUserData {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string;
  companyName: string;
  website?: string;
  industry?: string;
  additionalInfo?: string;
  accountId?: string | null;
  contactId?: string | null;
}

interface SalesforceTokenResponse {
  instance_url: string;
  access_token: string;
}

class SalesforceService {
  conn: Connection | null;

  constructor() {
    this.conn = null;
  }

  async authenticate(): Promise<Connection> {
    try {
      const myDomainUrl = 'https://orgfarm-979d8fb7ab-dev-ed.develop.my.salesforce.com';
      const tokenUrl = `${myDomainUrl}/services/oauth2/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', process.env.SF_CLIENT_ID ?? '');
      params.append('client_secret', process.env.SF_CLIENT_SECRET ?? '');

      const response = await axios.post<SalesforceTokenResponse>(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.conn = new jsforce.Connection({
        instanceUrl: response.data.instance_url,
        accessToken: response.data.access_token
      });
      return this.conn;
    } catch (error) {
      const errorData = axios.isAxiosError(error) && error.response
        ? error.response.data
        : error instanceof Error ? error.message : error;
      throw new Error(`Salesforce auth failed: ${JSON.stringify(errorData)}`, { cause: error });
    }
  }

  async syncAccountAndContact(userData: SalesforceUserData) {
    const conn = this.conn ?? await this.authenticate();

    try {
      const accountData: Record<string, string> = {
        Name: userData.companyName,
        Phone: userData.phone
      };

      if (userData.website) accountData.Website = userData.website;
      if (userData.industry) accountData.Industry = userData.industry;

      let accountId = userData.accountId;

      if (accountId) {
        await conn.sobject('Account').update({ Id: accountId, ...accountData });
      } else {
        const accountResult = await conn.sobject('Account').create(accountData);

        if (!accountResult.success) {
          throw new Error(`Failed to create Account: ${JSON.stringify(accountResult.errors)}`);
        }

        accountId = accountResult.id;
      }

      const contactData: Record<string, string | null> = {
        FirstName: userData.firstName,
        LastName: userData.lastName,
        Email: userData.email,
        Phone: userData.phone,
        AccountId: accountId
      };

      if (userData.additionalInfo) contactData.Description = userData.additionalInfo;

      let contactId = userData.contactId;

      if (contactId) {
        await conn.sobject('Contact').update({ Id: contactId, ...contactData });
      } else {
        const contactResult = await conn.sobject('Contact').create(contactData);

        if (!contactResult.success) {
          throw new Error(`Failed to create Contact: ${JSON.stringify(contactResult.errors)}`);
        }

        contactId = contactResult.id;
      }

      return {
        accountId,
        contactId,
        success: true
      };

    } catch (error) {
      this.conn = null;
      throw error;
    }
  }
}

export default new SalesforceService();
