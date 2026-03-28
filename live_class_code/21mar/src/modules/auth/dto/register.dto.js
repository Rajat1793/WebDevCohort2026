import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto";

class RegisterDto extends BaseDto {
    static schema = Joi.object({
        name: Joi.string().required().trim().min(3).max(50),
        email: Joi.string().email().required().trim().lowercase(),
        password: Joi.string().required().min(6).message("Password must be at least 6 characters long"),
        role: Joi.string().valid("user", "seller").default("user")
    });
}

export default RegisterDto;