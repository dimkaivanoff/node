

module.exports = function sendSuccess (data, options) {
  var req = this.req;
  var res = this.res;

  res.send({success: true, data: data});
}
