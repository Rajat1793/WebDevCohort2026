import { generateResetToken } from "../../common/utils/jwt.utils.js"
import User from  "./auth.model.js"

const register = async ({name, email, password}) => {
    // TODO: add user to db
    const existing = await User.findOne({email})
    if(existing) {
        throw ApiError.conflict("Email already in use")
    }

    const {rawToken, hashedToken} = generateResetToken()
    await User.create({
        name, 
        email, 
        password, 
        role, 
        verificationToken: hashedToken,
    })

    // Send an email to user with token
    return userObj
}

export {register}