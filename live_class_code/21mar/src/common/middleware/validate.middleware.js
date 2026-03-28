import ApiError from '../utils/api.error.js';

// Custom validator for middleware, it takes a DTO class as an argument and returns a middleware function
const validate = (DtoClass) => {
    return (req, res, next) => {
        const {errors, value} =DtoClass.validate(req.body)
        if (errors) {
            throw ApiError.BadRequest(errors.join("; "));
        }
        req.body = value; // validated values goes to the next middleware or route handler
    }
}
export default validate;