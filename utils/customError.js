class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

module.exports = CustomError; //exporting the customError that is used from nodejs-error docs
