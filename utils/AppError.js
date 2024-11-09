class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Indicate whether the error is operational
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
