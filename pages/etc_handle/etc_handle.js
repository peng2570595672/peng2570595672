/**
 * @author 老刘
 * @desc 签约成功
 */
const util = require('../../utils/util.js');
const app = getApp();
Page({
	data: {
		testData: [{
				title: '哪些车辆支持办理ETC？',
				contant: '支持9座及以下的小型汽车办理，货车办理通，敬请关注。'
			},
			{
				title: '办理你们的ETC是否支持全国通行？通行全国高速都是95折',
				contant: '是的。目前全国高速已实现联网，ETC设备通行均可享受通行费95折的普惠政策，如部分省份高速或路段还有其他优惠可叠加同享。'
			},
			{
				title: '哪些车辆支持已经办理过ETC还能再办吗？',
				contant: '根据交通部规定一个车牌号只能办理一个ETC设备，如您的车牌已办理过，需要先注销原有ETC，可联系在线客服咨询如何注销'
			},
			{
				title: '通行后如何扣费？',
				contant: '出站以后自动使用微信免密代扣，扣除已绑定账户余额。扣费时间因高速接收及处理路方信息需时，一般当日通行次日内完成扣费，部分路段会有数天延迟。'
			}
		],
		viewTc: {},	// 用于存放弹窗数据
		whetherToStay: false,	// 用于控制显示弹窗时，最底层页面禁止不动
		isFade: true,	// 控制"浮动按钮"的显示隐藏
		lastScrollTop: 0,	// 控制"浮动按钮"在向上滚动和禁止时不隐藏，向下滚动时隐藏

		show: true,
		duration: 0,
		position: 'center',
		customStyle: 'overflow:auto !important;z-index:-10 !important;',
		overlayStyle: 'overflow:auto !important;z-index:-10'

	},
	async onLoad () {
		util.customTabbar(this, 1);
		// 查询是否欠款
		await util.getIsArrearage();
	},
	async onShow () {
		// 查询是否欠款
		await util.getIsArrearage();
		await util.getUserIsVip();
		this.setData({
			show: true,
			duration: 0,
			position: 'center',
			customStyle: 'overflow:auto !important;z-index:-10 !important;',
			overlayStyle: 'overflow:auto !important;z-index:-10'
		});
		console.log(this.data.show);
	},
	// 监听返回按钮
	onClickBackHandle () {
		wx.navigateBack({
			delta: 1
		});
	},
	onClickHandle () {
		wx.uma.trackEvent('index_next');
		util.go('/pages/default/receiving_address/receiving_address');
	},
	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			util.go('/pages/login/login/login');
			return;
		}
		wx.uma.trackEvent('index_for_service');
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	goTruck () {
		// 去办理货车ETC
		util.go(`/pages/truck_handling/index/index`);
	},
	// 监听页面滚动
	onPageScroll (e) {
		if (e.scrollTop > this.data.lastScrollTop) {
			this.setData({
				isFade: false
			});
		}
		// 页面停止滚动或页面向上滚动时 显示 "立即办理"按钮
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.setData({
					isFade: true,
					lastScrollTop: e.scrollTop
				});
			}, 500);
		})();
	},
	// 查看办理步骤 弹窗 和 查看热门问答 弹窗
	viewProcedure (e) {
		let flag = e.currentTarget.dataset.pop || 0;
		let value = e.currentTarget.dataset.value || 0;
		if (flag) {
			if (flag === 'moduleOne') {
				this.setData({
					viewTc: {
						type: 'moduleOne'
					},
					whetherToStay: true
				});
			}
			if (flag === 'moduleTwo') {
				let data = this.data.testData;
				this.setData({
					viewTc: {
						type: 'moduleTwo',
						data
					},
					whetherToStay: true
				});
			}
			this.selectComponent('#viewProcedure').show();
		} else {
			if (value) {
			// 关闭弹窗 解除底层“禁止”状态
				this.setData({
					whetherToStay: false
				});
			}
		}
	},
	// 当弹出弹窗时，调用它
	stopRoll () {
		console.log('');
	},
	onBeforeLeave () {
		this.goBack();
	},

	// 返回上一页
	goBack () {
		this.setData({
			show: false
		});
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	}

});
