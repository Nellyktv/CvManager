import axios from 'axios';
import jsforce from 'jsforce';

class SalesforceService {
  constructor() {
    this.conn = null;
  }

  async authenticate() {
    try {
      const myDomainUrl = 'https://orgfarm-979d8fb7ab-dev-ed.develop.my.salesforce.com';
      const tokenUrl = `${myDomainUrl}/services/oauth2/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', process.env.SF_CLIENT_ID);
      params.append('client_secret', process.env.SF_CLIENT_SECRET);

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.conn = new jsforce.Connection({
        instanceUrl: response.data.instance_url,
        accessToken: response.data.access_token
      });
    } catch (error) {
      const errorData = error.response ? error.response.data : error.message;
      throw new Error(`Salesforce auth failed: ${JSON.stringify(errorData)}`);
    }
  }

  async syncAccountAndContact(userData) {
    if (!this.conn) {
      await this.authenticate();
    }

    try {
      const accountData = {
        Name: userData.companyName,
        Phone: userData.phone
      };

      if (userData.website) accountData.Website = userData.website;
      if (userData.industry) accountData.Industry = userData.industry;

      let accountId = userData.accountId;

      if (accountId) {
        await this.conn.sobject('Account').update({ Id: accountId, ...accountData });
      } else {
        const accountResult = await this.conn.sobject('Account').create(accountData);

        if (!accountResult.success) {
          throw new Error(`Failed to create Account: ${JSON.stringify(accountResult.errors)}`);
        }

        accountId = accountResult.id;
      }

      const contactData = {
        FirstName: userData.firstName,
        LastName: userData.lastName,
        Email: userData.email,
        Phone: userData.phone,
        AccountId: accountId
      };

      if (userData.additionalInfo) contactData.Description = userData.additionalInfo;

      let contactId = userData.contactId;

      if (contactId) {
        await this.conn.sobject('Contact').update({ Id: contactId, ...contactData });
      } else {
        const contactResult = await this.conn.sobject('Contact').create(contactData);

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
