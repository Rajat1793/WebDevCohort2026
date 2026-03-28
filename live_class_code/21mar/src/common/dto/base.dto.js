import joi from 'joi';

class BaseDto {
    static schema = joi.object({});

    static validate(data){
        // very specific to Joi
        this.schema.validate(data, {
            abortEarly: false, // return all errors, not just the first one
            stripUnknown: true, // remove unknown keys from the validated data
        })
        if (error) {   
            const errors = error.details.map((detail) => detail.message); // extract error messages
            return {errors, value: null}; // return errors and null value if validation fails
        }
        return {errors: null, value}; // value is the validated and possibly transformed data
    }
}
export default BaseDto;