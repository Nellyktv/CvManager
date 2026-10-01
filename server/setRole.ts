import 'dotenv/config';
import sequelize from './dB.js';
import { User } from './models/models.js';
import { USER_ROLES, type UserRole } from './types/auth.js';

const email = process.argv[2];
const role = process.argv[3] || 'RECRUITER';

const isUserRole = (value: string): value is UserRole => (USER_ROLES as readonly string[]).includes(value);

const run = async () => {
    if (!email) {
        const users = await User.findAll({
            attributes: ['id', 'email', 'role'],
            order: [['id', 'ASC']],
        });
        console.table(users.map((u) => u.toJSON()));
    } else if (!isUserRole(role)) {
        console.log(`Unknown role: ${role}. Use one of: ${USER_ROLES.join(', ')}`);
    } else {
        const [count] = await User.update({ role }, { where: { email } });
        console.log(count ? `OK: ${email} -> ${role}` : `User not found: ${email}`);
    }
    await sequelize.close();
};

run();
