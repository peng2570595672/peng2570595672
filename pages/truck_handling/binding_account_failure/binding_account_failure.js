/**
 * @author 老刘
 * @desc 开户失败
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		code: undefined
	},
	onLoad (options) {
		this.setData({
			code: parseInt(options.code)
		});
	}
});
