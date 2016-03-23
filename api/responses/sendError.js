module.exports = function sendError (data) {
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  res.status(200).send({ 'success': false, 'message': data.message, 'error': data.err });
}
