
const populateCreatedBy = function(req, res, next) {
    req.body.created_by = req.userId;
    next();
  };

module.exports = populateCreatedBy;