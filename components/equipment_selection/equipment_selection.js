const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
	},
	data: {
		activeIndex: 0,
		mask: false,
		wrapper: false
	},
	methods: {
		// 显示或者隐藏
		switchDisplay (isShow) {
			if (isShow) {
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
		handleDevice () {
			util.go('/pages/obu_activate/neimeng_guide/neimeng_guide');
			this.setData({
				activeIndex: 1
			});
		},
		handleChoic () {
			util.go('/pages/obu_activate/neimeng_choice/neimeng_choice');
		},
		// 点击半透明层
		onClickTranslucentHandle () {
			this.triggerEvent('onClickTranslucentHandle', {});
		},
		// 拦截点击非透明层空白处事件
		onClickCatchHandle () {
		}
	}
});
