import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplate.js"
import { mailtrapClient, sender } from "./mailtrap.config.js"

export const sendVerificationEmail = async (email, verificationToken) => {
    const recipient = [{ email }]

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email verification"
        })

        console.log("Email sent successfully", response)
    } catch (error) {
        console.log("Error sending email", error)
    }
}

export const sendWelcomeEmail = async (email, name) => {
    const recipient = [{ email }];

    try {

        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            template_uuid: "ea3e0c14-1200-4e01-beeb-30b964043946",
            template_variable: {
                company_info_name: "Auth Company",
                name: name,
            }
        })

        console.log("Welcome Email sent successfully", response);
    } catch (error) {
        console.log(" Error sending welcome error");

        throw new Error(`Error sending welcome email: ${error}`)
    }
}

export const sendPasswordResetEmail = async (email, resetToken) => {
    const recipient = [{ email }]
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetToken),
            category: "Password Reset"
        })

        console.log("Reset passwod link sent successfully", response);
    } catch (error) {
        console.error('Error sending password reset email', error)

        throw new Error(`Error sending password reset email: ${error}`)
    }
}

export const sendResetSuccessEmail = async (email) => {
    const recipient = [{ email }]
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset"
        })

        console.log("Password reset successsfull", response);
    } catch (error) {
        console.error('Error sending password reset email', error)

        throw new Error(`Error sending password reset email: ${error}`)
    }
}