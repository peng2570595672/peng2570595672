const app = getApp();
const util = require('../../../utils/util.js');
Page({
	data: {
		// canvases: null,
		animating: 0,	// 是否正在动画中
		animations: [],	// 等待中的动画回调列表
		animation_1: 0,
		animation_2: 0,
		animation_3: 0
	},
	onLoad () {
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#fff',
			backgroundColorBottom: '#f6f7f8'
		});
		// this.setData({canvases: wx.createSelectorQuery().selectAll('.canvas')});
		setTimeout(() => {
			this.processQueue(1);
			this.processQueue(2);
			this.processQueue(3);
		}, 60);
	},
	onShow () {
	},
	// 处理动画队列函数
	processQueue (num) {
		if (this.data.animating) {
			this.data.animations.push(function () { this.processAnimation(num); });
		} else {
			this.processAnimation(num);
		}
	},
	// 处理动画
	processAnimation (num) {
		// 当前动画时间（此参数只能影响到下一个动画何时开始，因为当前动画的时间是在 css 中的 animation 中设置的
		let during = 0;
		switch (num) {
			case 1: during = 1500; break;
			case 2: during = 2500; break;
			case 3: during = 2000; break;
		}
		// 激活正在动画的状态
		this.setData({animating: 1});
		// 处理队列中的下一个动画
		setTimeout(() => {
			this.setData({animating: 0});
			let fun = this.data.animations.shift();
			fun && fun.call(this);
		}, during);
		// 处理当前动画
		this.setData({[`animation_${num}`]: 1});
	},
	// TODO 有时间可以考虑页面滚动 + 重复触发动画
	onPageScroll () {
	},
	// 下一步
	next () {
		wx.uma.trackEvent('installation_tutorial_page_next');
		let baseInfo = wx.getStorageSync('baseInfo');
		if (!baseInfo) return util.showToastNoIcon('用户信息丢失，请重新打开小程序');
		util.go('/pages/obu_activate/instructions/index');
	}
});
