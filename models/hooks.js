export const handleSaveError = (error, data, next)=> {
    const { name, code } = error;

  const status = name === 'MongoServerError' && code === 11000 ? 409 : 400;
  error.status = status;
  next();
}

export const runValidatorsAtUpdate = function(next) {
    this.options.runValidators = true;
    this.options.new = true;
    next();
}