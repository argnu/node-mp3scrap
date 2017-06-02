module.exports.ok = function(res, json) {
  res.status(200).json(json);
};

module.exports.token_expire = function(res) {
  res.status(400).json({ message: "Token Expired" });
};

module.exports.not_authorized = function(res) {
  res.status(403).json({ message: "Not Authorized" });
};

module.exports.invalid_token = function(res) {
  res.status(401).json({ message: "Invalid Token" });
};

module.exports.not_found = function(res) {
  res.status(404).json({ message: "Documento inexistente" });
};

module.exports.internal_error = function(res, e) {
  res.status(500).json({ message: 'Error interno en el servidor', error: e });
};
