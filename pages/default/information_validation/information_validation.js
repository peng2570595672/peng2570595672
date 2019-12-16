/**
 * @author 狂奔的蜗牛
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		opened: false,
		current: 0
	},
	onLoad () {
	},
	//  展开和关闭切换
	onClickToggleOpenOrCloseHandle () {
		this.setData({
			opened: !this.data.opened
		});
	},
	// 轮播图当前页改变
	onChangeHandle (e) {
		this.setData({
			current: e.detail.current
		});
	}
});
