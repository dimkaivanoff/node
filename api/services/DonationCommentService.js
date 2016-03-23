module.exports = {
	'createDonComment': createDonComment,
	'getComments'	  : getComments,
	'getUserComments' : getUserComments,
	'getCommentInfo'  : getCommentInfo,
	'updateComment'   : updateComment,
	'deleteComment'   : deleteComment
};

/**
 * @name createDonComment
 * @desc Creating of the new donation comment
 * @param params - params for new donation comment
 * 		  user   - user who make request
 * 		  call   - callback function
 */
function createDonComment(params, user, call) {

	async.auto({
		donation: function (next) {
			Donation.findOne(params.donationId).exec(next);
		},
		createDonatioComment: ['donation', function (next, data) {
			if (!data.donation) {
				return next('Donation with such id not found');
			}

			DonationComment.create({
				'DonationId': data.DonationId,
				'UserId'    : user.UserId,
				'Anonymous' : params.anonymous,
				'Comment'   : params.comment
			}).exec(next);
		}],
		sendNotifications: ['createDonatioComment' , function (next, data) {
			var names 		  	= CommonUtils.getNamesFromComment(data.createDonatioComment.Comment) || [],
				donationComment = data.createDonatioComment;

			if ( names.length ) {
				return CommonUtils.createNotifications(names, donationComment, user, {
					'idField': 'DonationCommentId',
					'object' : 'dontioncomment'
				}, next);
			}

			next(null);
		}]
	}, function (err, data) {
		call(err, data.createDonatioComment);
	});
}

/**
 * @name getComments
 * @desc Getting of the donation comments
 * @param params - params (offset and perpage)
 * 		  call   - callback function
 */
function getComments(params, call) {

	async.auto({
		getComments: function (next) {
			var settings = CommonUtils.getSearchConfig(params, { 'DonationId': params.donationId });

			CommonUtils.getDBRecords(DonationComment, settings, next);
		},
		setStatus: ['getComments', function (next, data) {
			CommonUtils.setDeleteStatus(data.getComments, 'Deleted');
			next(null);
		}],
		getPostedUsers: ['getComments', function (next, data) {
			var usersIds = _.pick(data.getComments, 'UserId');

			User.find(usersIds).exec(next);
		}],
		setUsersInfo: ['getPostedUsers', function (next, data) {
			var groupedByUsers = _.groupBy(data.getComments, 'UserId'),
				users  		   = data.getPostedUsers;

			_.each(users, function (user) {
				CommonUtils.setUserInfo(user, groupedByUsers[user.UserId]);
			});
			next(null);
		}]
	}, function (err, data) {
		call(err, data.getComments);
	});

}

/**
 * @name getUserComments
 * @desc Getting of the user comments
 * @param params - params (offset and perpage)
 * 		  user   - user who make request
 * 		  call   - callback function
 */
function getUserComments(params, user, call) {
	var settings = CommonUtils.getSearchConfig(params, { 'UserId': user.UserId });

	CommonUtils.getDBRecords(DonationComment, settings, call);
}

/**
 * @name getCommentInfo
 * @desc Getting of the info about donation comment
 * @param commentId - id of the comment
 * 		  call   	- callback function
 */
function getCommentInfo(commentId, call) {

	async.auto({
		getComment: function (next) {
			DonationComment.findOne(commentId).exec(next);
		},
		isDeleted: ['getComment', function (next, data) {
			if (!data.getComment) {
				return next('Donation comment was not found');
			}

			next(null, data.getComment.Deleted);
		}],
		setInfo: ['isDeleted', function (next, data) {
			if (!data.isDeleted) {
				return next(null);
			}

			data.getComment.Comment = 'Deleted';
			User.findOne(data.getComment.DeletedByUser).exec(function (err, user) {
				if (err || !user) {
					return next(err || 'Cannot find user who have delete this comment');
				}

				data.getComment.DeletedByUser = user.UserName;
				next(null);
			});
		}]
	}, function (err, data) {
		call(err, data.getComment);
	});
}

/**
 * @name updateComment
 * @desc Getting of the info about donation comment
 * @param params - donation comment id and new comment
 * 		  user   - user who make request
 * 		  call   - callback function
 */
function updateComment(params, user, call) {

	async.auto({
		getComment: function (next) {
			DonationComment.findOne({
				'DonationCommentId': params.donationCommentId,
				'UserId' 		   : user.UserId
			}).exec(next);
		},
		updateComment: ['getComment', function (next, data) {
			if (!data.getComment || data.getComment.Deleted) {
				if (!data.getComment) { return next('Comment not found or is not belongs to you'); }

				return next('Comment was deleted');
			}

			data.getComment.Comment = params.comment;
			data.getComment.save(next);
		}]
	}, function (err, data) {
		call(err, data.updateComment);
	});
}

/**
 * @name deleteComment
 * @desc Getting of the info about donation comment
 * @param params - donation comment id and new comment
 * 		  user   - user who make request
 * 		  call   - callback function
 */
function deleteComment(donCommentId, user, call) {

	DonationComment.update({
		'DonationCommentId': donCommentId
	}, {
		'Deleted' 		: true,
		'DeletedByUser' : user.UserId
	}).exec(function (err, deletedComment) {
		if (err || !deletedComment.length) {
			return call(err || 'Comment was not found');
		}

		call(null, deletedComment[0]);
	});
}
