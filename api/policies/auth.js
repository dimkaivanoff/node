var emailValidator = require('email-validator');

module.exports = function (req, res, next) {
	var searchQuery = {},
		username 	= req.body.username,
	  	password 	= req.body.password;

	if (!username || !password) {
		return res.sendError({ 'message': 'params missed'});
	}

  	if (emailValidator.validate(username)) {
        searchQuery.EmailAddress = username;
  	} else {
    	searchQuery.UserName = username;
    }

    async.auto({
        user: function (call) {
            User.findOne(searchQuery).exec(call);
        },
        isExist: ['user', function (call, data) {
            if (!data.user) {
                return call('User not found');
            }

            call(null);
        }],
        checkRole: ['isExist', function (call, data) {
            if ( isNeedAdmin(req.role) && !userIsAdmin(data.user) ) {
                return call('User is not admin');
            }

            call(null);
        }]
    }, function (err, data) {
        if (err) {
            return res.sendError({
                'message': 'Error while authorithation',
                'err'    : err
            });
        }

        req.user = data.user;
        next(null);
    });
};

/**
 * @name isNeedAdmin
 * @desc Checking does user who tries to log in must be an admin
 * @param req - request object
 *        res - response object
 */
function isNeedAdmin(role) {
    return role.toLowerCase() === 'admin';
}

/**
 * @name userIsAdmin
 * @desc Checking is user admin or not
 * @param req - request object
 *        res - response object
 */
function userIsAdmin(user) {
    return user.UserType.toLowerCase() === 'admin';
}
