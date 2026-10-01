import type { NextFunction, Request, Response } from 'express';
import powerAutomateService from './powerAutomateService.js';
import { User } from '../../models/models.js';
import { ApiError } from '../../errors/ApiError.js';
import { getAuthUser } from '../../utils/validation.js';

interface SupportTicketBody {
  summary?: string;
  priority?: string;
  position?: string;
  link?: string;
}

const createSupportTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { summary, priority, position, link }: SupportTicketBody = req.body;

    if (!summary || !priority || !link) {
      return next(ApiError.badRequest('Summary, priority and link are required'));
    }

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
    const message = error instanceof Error ? error.message : String(error);
    return next(ApiError.internal('Failed to create support ticket: ' + message));
  }
};

export default { createSupportTicket };
