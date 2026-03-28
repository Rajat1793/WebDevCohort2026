// Express 5 doesnt require async handlers to be wrapped in try/catch blocks, it will handle errors automatically and pass them to the error handling middleware. So we can write our controller functions without try/catch blocks.

import * as authService from "./auth.service.js";
import ApiResponse from "../../common/utils/apiResponse.js";

const register =  async () => {
    const user = await authService.register(req.body)
    ApiResponse.created(resizeBy, "Registration success", user)
}

export {register}