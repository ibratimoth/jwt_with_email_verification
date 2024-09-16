import crypto from 'crypto'
import { User } from './../models/User.js'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js'
import { sendPasswordResetEmail, sendVerificationEmail, sendResetSuccessEmail } from '../mailtrap/email.js'
import { sendWelcomeEmail } from '../mailtrap/email.js'

export const registerController = async (req, res) => {
    try {

        const { name, email, password } = req.body

        // validation
        if (!name || !email || !password) {
            return res.send({
                message: 'All fields must be filled'
            })
        }

        if (!validator.isEmail(email)) {
            return res.send({
                message: 'Email is not valid'
            })
        }

        // Extract the local part of the email address
        const localPart = email.split('@')[0];

        // Check if the local part starts with a lowercase letter
        if (localPart[0] !== localPart[0].toLowerCase()) {
            return res.status(400).send({
                message: 'Email must start with a lowercase letter'
            });
        }

        const minLength = 6;
        const hasUpperCase = true;
        const hasLowerCase = true;
        const hasNumber = true;
        const hasSpecialCharacter = true;

        //password validation
        const isValidPassword = validator.isStrongPassword(password, {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers: hasNumber,
            hasSymbols: hasSpecialCharacter,
        });

        if (!isValidPassword) {
            return res.status(400).send({
                message:
                    "Password is not strong include uppercase, lowercase and characters must be 6 long characters",
            });
        }
        //existing user
        const existingUser = await User.findOne({ email: email })

        if (existingUser) {
            return res.status(400).send({
                success: false,
                message: 'Already Registered please login',
            })
        }
        //register user
        const hashedPassword = await bcrypt.hash(password, 12)
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString()
        //save
        const user = await new User({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000
        }).save()

        generateTokenAndSetCookie(res, user._id)

        await sendVerificationEmail(user.email, verificationToken)
        res.status(201).send({
            success: true,
            message: "User Registered successfully",
            user: {
                ...user._doc,
                password: undefined,
            }
        })
    } catch (error) {
        console.log(error)
        res.status().send({
            success: false,
            message: 'Error in Registration',
            error
        })
    }
}

export const verifyEmail = async (req, res) => {
    const { code } = req.body
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code" })
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error while verifying email',
            error
        })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({ email })

        if (!user) {
            res.status(400).json({
                succes: false,
                message: "Invalid credentials"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        generateTokenAndSetCookie(res, user._id)
        user.lastLogin = new Date();

        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfuly",
            user: {
                ...user._doc,
                password: undefined,
            }
        })
    } catch (error) {
        console.log("Error in Login", error);
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

export const logout = async (req, res) => {
    res.clearCookie('token')
    res.status(200).json({ success: true, message: "Logged out successfully" })
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; //1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt

        await user.save()

        // send email
        await sendPasswordResetEmail(user.email, `http://localhost:6003/reset-password/${resetToken}`)

        res.status(200).json({ success: true, message: "Password reset link sent to your email" })
    } catch (error) {
        console.log("Error in forgotPassword", error);
        res.status(400).json({ success: false, message: error.message })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params
        const { password } = req.body

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        })

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" })
        }

        //update password
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;

        user.save()

        await sendResetSuccessEmail(user.email);

        res.status(200).json({ success: true, message: "Password reset successful" })
    } catch (error) {
        console.log("Error in resetPassword", error)
        res.status(400).json({ success: false, message: error.message })
    }
}

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password")
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        console.log("error in checkAuth", error);
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}