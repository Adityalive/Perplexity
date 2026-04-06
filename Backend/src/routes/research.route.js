import { authverify } from '../middleware/auth.middleware.js';
import { Router } from 'express';
import { runResearch } from '../controller/research.controller.js';

const researchRouter = Router();

researchRouter.post('/research', authverify, runResearch);

export default researchRouter;
