// Authentication and Authorization Middleware
const protect = async (req, res, next) => {
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    next();
  };
};

module.exports = { protect, authorize };
