import { Router } from 'express';
import { healthcheck } from "../controllers/healthcheck.controller.js"

const route = Router();

route.route('/').get(healthcheck);

export default route