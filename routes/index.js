import { Router } from 'express';

const router = Router();

// Example route
router.get("/test", (req, res) => {
    res.json({ message: "API is working!" });
});

export default router;
