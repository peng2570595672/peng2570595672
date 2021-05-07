const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		details: {
			type: Object,
			value: {}
		}
	},
	data: {
		mask: false,
		wrapper: false
	},
	methods: {
		// 显示或者隐藏
		switchDisplay (isShow) {
			if (isShow) {
				// 之前已经加载了数据 不再进行加载
				this.setData({
					mask: true,
					wrapper: true
				});
			} else {
				this.setData({
					wrapper: false
				});
				setTimeout(() => {
					this.setData({
						mask: false
					});
				}, 400);
			}
		},
		// 点击半透明层
		onClickHandle () {
			this.triggerEvent('onClickHandle', {});
		},
		// 拦截点击非透明层空白处事件
		onClickCatchHandle () {
		}
	}
});
