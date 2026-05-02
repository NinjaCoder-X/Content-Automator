import { Router } from "express";
import topicsRouter from "./topics";
import scriptsRouter from "./scripts";
import videosRouter from "./videos";
import statsRouter from "./stats";
import generateRouter from "./generate";

const router = Router();

router.use(topicsRouter);
router.use(scriptsRouter);
router.use(videosRouter);
router.use(statsRouter);
router.use(generateRouter);

export default router;
