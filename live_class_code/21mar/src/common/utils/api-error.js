class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // To differentiate between operational errors and programming errors
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad request") {
        return new ApiError(message, 400);
    }
    
    static unauthorized(message = "Unauthorized") {
        return new ApiError(message, 401);
    }
}

throw new ApiError("This is an API error");