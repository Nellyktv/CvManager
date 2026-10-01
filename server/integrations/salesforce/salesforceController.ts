import type { NextFunction, Request, Response } from 'express';
import salesforceService from './salesforceService.js';
import { User } from '../../models/models.js';
import { ApiError } from '../../errors/ApiError.js';
import { getAuthUser } from '../../utils/validation.js';

interface SalesforceSyncBody {
  companyName?: string;
  phone?: string;
  website?: string;
  industry?: string;
  additionalInfo?: string;
}

const syncUserToSalesforce = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthUser(req).id;
    const { companyName, phone, website, industry, additionalInfo }: SalesforceSyncBody = req.body;

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
    console.error('Salesforce sync failed:', error);
    return next(ApiError.internal('An error occurred, please try again later'));
  }
};

export default { syncUserToSalesforce };
