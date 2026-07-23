import jwt from 'jsonwebtoken';
import { User } from '../models/models.js';


const optionalAuthMiddleware = async (req, res, next) => {

    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return next();
        }
        const userData = jwt.verify(token, process.env.SECRET_KEY_ROLE);

        const user = await User.findByPk(userData.id)

        if (!user || user.isBlocked) {
            return next();
        }

        req.user = userData;
        next();

    } catch {
        next();
    }

};
export default optionalAuthMiddleware;
