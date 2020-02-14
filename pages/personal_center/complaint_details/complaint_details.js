const util = require('../../../utils/util.js');
Page({
	data: {
		title: '',
		content: '',
		available: false
	},
	// 内容和问题输入
	onInputChangedHandle (e) {
		let value = e.detail.value;
		let key = e.currentTarget.dataset.key;
		this.setData({
			[`${key}`]: value,
			available: this.validateAvailable()
		});
	},
	validateAvailable () {
		return this.data.content.length && this.data.title ? true : false;
	},
	// 提交
	go () {
	}
});
