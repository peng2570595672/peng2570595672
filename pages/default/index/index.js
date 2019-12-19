/**
 * @author 狂奔的蜗牛
 * @desc 首页
 */
const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 免费办理
	freeProcessing () {
		util.go('/pages/default/receiving_address/receiving_address');
	},
	// 跳转到个人中心
	onClickForJumpPersonalCenterHandle (e) {
		let url = e.currentTarget.dataset.url;
		util.go(`/pages/personal_center/${url}/${url}`);
	}
});
