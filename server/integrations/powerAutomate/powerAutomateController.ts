import { supportTicketBody } from '../../schemas/requestSchemas.js';
import type { NextFunction, Request, Response } from 'express';
import powerAutomateService from './powerAutomateService.js';
import { User } from '../../models/models.js';
import { ApiError } from '../../errors/ApiError.js';
import { getAuthUser, parseOrBadRequest } from '../../utils/validation.js';

const createSupportTicket = async (req: Request, res: Response, next: NextFunction) => {
  const { summary, priority, position, link } = parseOrBadRequest(supportTicketBody.parse, req.body);
  try {
    const [user, admins] = await Promise.all([
      User.findByPk(getAuthUser(req).id),
      User.findAll({ where: { role: 'ADMIN' }, attributes: ['email'] }),
    ]);

    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    const ticket = {
      reportedBy: `${user.firstName} ${user.lastName} (${user.role})`,
      position: position || null,
      link,
      priority,
      summary,
      adminEmails: admins.map((admin) => admin.email),
    };

    const fileName = await powerAutomateService.uploadTicketFile(ticket);

    return res.json({ success: true, fileName });
  } catch (error) {
    console.error('Support ticket upload failed', error instanceof Error ? error.name : 'Unknown error');
    return next(ApiError.internal('Failed to create support ticket'));
  }
};

export default { createSupportTicket };
