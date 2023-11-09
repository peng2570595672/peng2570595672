const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
	},
	data: {
		activeIndex: 0,
		mask: false,
		wrapper: false,
		channel: undefined
	},
	methods: {
		// 显示或者隐藏
		switchDisplay (isShow) {
			if (isShow) {
				let baseInfo = wx.getStorageSync('baseInfo');
				if (!baseInfo) return util.showToastNoIcon('用户信息丢失，请重新打开小程序');

				this.setData({
					mask: true,
					wrapper: true,
					channel: baseInfo && baseInfo.channel ? baseInfo.channel : undefined
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
			wx.setStorageSync('installGuid', this.data.channel === 23 ? '金溢（无卡式）' : '铭创（无卡式）');
			util.go('/pages/obu_activate/neimeng_guide/neimeng_guide');
			this.setData({
				activeIndex: 1
			});
		},
		handleChoic () {
			util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${this.data.channel}`);
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
