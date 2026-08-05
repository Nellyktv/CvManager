import powerAutomateService from './powerAutomateService.js';
import { User } from '../../models/models.js';
import { ApiError } from '../../errors/ApiError.js';

const createSupportTicket = async (req, res, next) => {
  try {
    const { summary, priority, position, link } = req.body;

    if (!summary || !priority || !link) {
      return next(ApiError.badRequest('Summary, priority and link are required'));
    }

    const [user, admins] = await Promise.all([
      User.findByPk(req.user.id),
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
    return next(ApiError.internal('Failed to create support ticket: ' + error.message));
  }
};

export default { createSupportTicket };
