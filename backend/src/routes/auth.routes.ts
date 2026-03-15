import { Router } from "express";
import { 
  register, 
  login, 
  profile, 
  forgotPassword, 
  verifyResetToken, 
  resetPassword,
} from "../controllers/auth";
import { googleAuth, googleCallback } from "../controllers/auth/google";
import { authMiddleware } from "../middlewares/auth";
import { getCountries } from "../controllers/auth/country";

const router = Router();

// auth routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);

// forgot password routes
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);

// utility routes
router.get("/", getCountries);

// google oauth
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;