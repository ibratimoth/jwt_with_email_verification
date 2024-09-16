import express from 'express'
import { forgotPassword, login, logout, registerController, verifyEmail, resetPassword, checkAuth } from '../controllers/userController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()
//register user

router.get('/check-auth', verifyToken, checkAuth)
router.post('/signup', registerController)

//Email verification
router.post('/verify-email', verifyEmail)

//Login route
router.post("/login", login)

//Logout route
router.post('/logout', logout)

//forgot password link
router.post('/forgot-password', forgotPassword)

//reset-password
router.post('/reset-password/:token', resetPassword)
export default router;