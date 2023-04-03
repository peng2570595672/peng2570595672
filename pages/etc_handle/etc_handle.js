
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
				contant: '支持9座及以下的小型汽车办理，货车办理通道暂未开通，敬请关注。'
			},
			{
				title: '办理你们的ETC是否支持全国通行？通行全国高速都是95折',
				contant: '是的。目前全国高速已实现联网，ETC设备通行均可享受通行费95折的普惠政策，如部分省份高速或路段还有其他优惠可叠加同享。'
			},
			{
				title: '已经办理过ETC还能再办吗？',
				contant: '根据交通部规定一个车牌号只能办理一个ETC设备，如您的车牌已办理过，需要先注销原有ETC，可联系在线客服咨询如何注销'
			}
		],
		testData2: [
			{
				title: '可以代他人办理吗？',
				contant: '为保障个人信息及扣费安全，本司暂不支持代办模式，邮寄信息可非本人接收，但开具通行费手机号、个人身份证、行驶证必须为同一持有人。'
			},
			{
				title: '通行费95折为什么我在账单看不到折扣？',
				contant: '通行折扣在您通行出站时已进行扣减，您所看到的通行账单实际是高速扣减完折扣后推送过来的扣费金额。'
			},
			{
				title: '办理后多久能发货',
				contant: '高速审核通过后最快当天寄出，正常预计2-5个工作日可收到设备。如遇疫情等不可控情况下，发货时间有可能延迟。'
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
		overlayStyle: 'overflow:auto !important;z-index:-10',
		imagesConfig: {
			backgroundColor: '#2D5D4F',
			marketingImgUrl: 'https://file.cyzl.com/g001/M01/D1/10/oYYBAGQiQxuAUiQdAABFf46DvQQ847.png'
		},
		citicBank: false, // 是否有中信银行联名套餐的订单
		transactScheduleData: undefined,	// 中信银行信用卡申请进度查询结果
		showhandleOrView: false,	// 中信银行信用卡 false 表示 ”查看信用卡办理进度“
		firstCiticBank: false	// 从中信银行过来
	},
	async onLoad () {
		this.getBackgroundConfiguration();
		util.customTabbar(this, 1);
	},
	async onShow () {
		// 查询是否欠款
		if (app.globalData.userInfo.accessToken) {
			await util.getIsArrearage();
			await util.getUserIsVip();
		}
		this.viewCiticBankList();
		this.setData({
			show: true,
			duration: 0,
			position: 'center',
			customStyle: 'overflow:auto !important;z-index:-10 !important;',
			overlayStyle: 'overflow:auto !important;z-index:-10'
		});
	},
	// 获取后台配置的数据
	async getBackgroundConfiguration () {
		let res = await util.getDataFromServersV2('consumer/member/common/pageConfig/query',{
			configType: 2, // 配置类型(1:小程序首页配置;2:客车介绍页配置;3:首页公告配置;4:个人中心配置)
			pagePath: 2, // 页面路径(1:小程序首页；2：客车介绍页；)
			platformType: 4, // 小程序平台(1:ETC好车主;2:微ETC;4:ETC+)，对于多选情况，将值与对应枚举值做与运算，结果为1则包含该选项。
			affectArea: '0', // 面向区域(0:全国)
			channel: '0'
		});
		console.log('后台数据：',res);
		if (!res) return;
		if (res.code === 0) {
			let data = res.data.contentConfig;	// 数据
			// 当前时间不在限定时间内，不往下执行
			if (!util.isDuringDate(res.data.affectStartTime, res.data.affectEndTime)) {
				// 获取的数据不符合是使用默认数据来展示
				return;
			}
			this.setData({
				imagesConfig: data.imagesConfig
			});
		}
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
				let data = this.data.testData2;
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
	// 分享
	onShareAppMessage () {
		return {
			title: 'ETC一键申办，无需储值，包邮到家',
			imageUrl: 'https://file.cyzl.com/g001/M01/CB/5E/oYYBAGQAaeyASw5fAABJbg74uSk558.png',
			path: '/pages/etc_handle/etc_handle'
		};
	},
	// 返回上一页
	goBack () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	},
	// 获取中信银行订单
	async viewCiticBankList () {
		let flag = app.globalData.myEtcList.filter(item => item.shopId === app.globalData.citicBankShopId);
		console.log(flag);
		if (flag.length > 0) {
			this.setData({
				citicBank: true,
				viewCiticBankList: flag,
				isCiticBankPlatinum: flag[0].shopProductId === app.globalData.citicBankShopshopProductId	// 判断是不是白金卡套餐
			});
			const result = await util.getDataFromServersV2('consumer/order/zx/transact-schedule', {
				orderId: flag[0].id
			});
			if (!result) return;
			if (result.code === 0) {
				console.log(result);
				this.setData({
					transactScheduleData: result.data,
					showhandleOrView: result.data[0].applyStatus === '111' || result.data[0].applyStatus === '112'
				});
			} else {
				util.showToastNoIcon(result.message);
			}
		} else {
			this.setData({
				firstCiticBank: app.globalData.isChannelPromotion === 100
			});
		}
	},
	// 中信联名权益 查看
	viewEquity (e) {
		// 未登录
		if (!app.globalData.userInfo?.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		let index = e.currentTarget.dataset.index;
		let url = index === '2' ? `https://creditcard.ecitic.com/h5/shenqing/iche/index.html?sid=SJCSJHT01&paId=${this.data.viewCiticBankList[0].id}&partnerId=SJHT` : `https://creditcard.ecitic.com/h5/shenqing/chezhu/index.html?sid=SJCSJHT01&paId=${this.data.viewCiticBankList[0].id}&partnerId=SJHT`;
		util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
	},
	citicBankProgress () {
		// 未登录
		if (!app.globalData.userInfo?.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		if (!this.data.showhandleOrView) {	// 查看信用卡办理进度
			util.go(`/pages/default/citicBank_processing_progress/citicBank_processing_progress?orderId=${this.data.viewCiticBankList[0].id}`);
		} else {	// 继续办理信用卡 - 跳转第三方
			let url = this.data.isCiticBankPlatinum ? `https://cs.creditcard.ecitic.com/citiccard/cardshopcloud/standardcard-h5/index.html?sid=SJCSJHT01&paId=${this.data.viewCiticBankList[0].id}&partnerId=SJHT&pid=CS0840` : `https://cs.creditcard.ecitic.com/citiccard/cardshopcloud/standardcard-h5/index.html?pid=CS0207&sid=SJCSJHT01&paId=${this.data.viewCiticBankList[0].id}&partnerId=SJHT`;
			util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
		}
	}

});
