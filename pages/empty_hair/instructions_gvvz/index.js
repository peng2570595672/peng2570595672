const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		timer: 0,	// 计时器秒数
		countdownText: '',	// 下一步按钮显示的倒计时文字
		auditStatus: 0
		},
	onLoad (options) {
		this.setData({
			auditStatus: +options.auditStatus
		});
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#fff',
			backgroundColorBottom: '#f6f7f8'
		});
		this.countdown();
	},
	onShow () {
	},
	// 计时器
	countdown () {
		let handler = setInterval(() => {
			let timer = this.data.timer - 1;
			let countdownText;
			if (timer < 0) {
				countdownText = '';
				clearInterval(handler);
			} else {
				countdownText = `（${timer}s）`;
			}
			this.setData({
				timer,
				countdownText
			});
		}, 1000);
	},
	next () {
		if (this.data.auditStatus !== 2) {
			util.showToastNoIcon('审核通过后才能激活');
			return;
		}
		wx.navigateToMiniProgram({
			appId: 'wx008c60533388527a',
			extraData: {},
			envVersion: 'release',
			fail: () => {
				util.showToastNoIcon('打开激活小程序失败');
			}
		});
	},
	showService () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
