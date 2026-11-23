import { salesforceSyncBody } from '../../schemas/requestSchemas.js';
import type { NextFunction, Request, Response } from 'express';
import salesforceService from './salesforceService.js';
import { User } from '../../models/models.js';
import { ApiError } from '../../errors/ApiError.js';
import { getAuthUser, parseOrBadRequest } from '../../utils/validation.js';

const syncUserToSalesforce = async (req: Request, res: Response, next: NextFunction) => {
  const { companyName, phone, website, industry, additionalInfo } = parseOrBadRequest(salesforceSyncBody.parse, req.body);
  try {
    const userId = getAuthUser(req).id;
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
    console.error('Salesforce sync failed', error instanceof Error ? error.name : 'Unknown error');
    return next(ApiError.internal('An error occurred, please try again later'));
  }
};

export default { syncUserToSalesforce };
