import salesforceService from './salesforceService.js';
import { User } from '../../models/models.js';
import { ApiError } from '../../errors/ApiError.js';

const syncUserToSalesforce = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyName, phone, website, industry, additionalInfo } = req.body;

    if (!companyName || !phone) {
      return next(ApiError.badRequest('Company name and phone are required'));
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    const sfData = await salesforceService.syncAccountAndContact({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone,
      companyName,
      website,
      industry,
      additionalInfo,
      accountId: user.salesforceAccountId,
      contactId: user.salesforceContactId,
    });

    await user.update({
      salesforceAccountId: sfData.accountId,
      salesforceContactId: sfData.contactId,
    });

    return res.json({
      success: true,
      message: 'Successfully synced to Salesforce',
      salesforceContactId: sfData.contactId,
    });
  } catch (error) {
    return next(ApiError.internal('Failed to sync with Salesforce: ' + error.message));
  }
};

export default { syncUserToSalesforce };
