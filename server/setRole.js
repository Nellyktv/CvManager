import 'dotenv/config';
import sequelize from './dB.js';
import { User } from './models/models.js';

const email = process.argv[2];
const role = process.argv[3] || 'RECRUITER';

const run = async () => {
    if (!email) {
        const users = await User.findAll({
            attributes: ['id', 'email', 'role'],
            order: [['id', 'ASC']],
        });
        console.table(users.map((u) => u.toJSON()));
    } else {
        const [count] = await User.update({ role }, { where: { email } });
        console.log(count ? `OK: ${email} -> ${role}` : `User not found: ${email}`);
    }
    await sequelize.close();
};

run();
