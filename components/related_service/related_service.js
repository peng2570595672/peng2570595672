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
		showPrompt: false,
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
		// 监听页面滚动事件
		scroll (e) {
			this.setData({
				showPrompt: e.detail.scrollTop > 10 ? false : true
			});
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
