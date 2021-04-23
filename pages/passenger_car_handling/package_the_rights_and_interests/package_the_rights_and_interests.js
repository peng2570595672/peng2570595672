/**
 * @author 老刘
 * @desc 选择套餐
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		listOfPackages: undefined,
		activeIndex: 0,// 当前轮播下标 -- 用于计算轮播高度
		choiceIndex: 0,// 当前选中套餐下标
		activeEquitiesIndex: -1,// 当前选中权益包
		rightsAndInterestsList: [],// 加购权益列表
		basicServiceList: [
			{title: 'ETC设备与卡片', tips: '包邮'},
			{title: '设备质保两年'},
			{title: 'ETC设备与卡片'},
			{title: 'ETC设备与卡片'}
		],
		otherServiceList: [
			{title: '车主服务享便捷', subTitle: '价值168元'},
			{title: '生活服务享精彩', subTitle: '价值100元+'}
		],
		characteristicServiceList: [
			{title: '中国石油特惠加油'},
			{title: '高速通行享2倍积分'}
		],
		serviceList: [
			{
				detailsTitle: '车主服务',
				list: [
					{
						logo: '/pages/passenger_car_handling/assets/not_charge.svg',
						title: '每月领驾乘险',
						describe: '10000元初始驾驶意外险，如每月无违章，额外获得5000元，最高可提升至50000元。'
					},
					{
						logo: '/pages/passenger_car_handling/assets/wechat_pay.png',
						title: '设备延保1年',
						describe: 'ETC设备非人为损坏质保延长一年，与设备质保叠加最高可达到三年质保。'
					},
					{
						logo: '/pages/passenger_car_handling/assets/not_charge.svg',
						title: '违章随时查',
						describe: '每月可免费查询车辆违章情况'
					}
				]
			},
			{},
			{
				detailsTitle: '特色服务',
				list: [
					{
						logo: '/pages/passenger_car_handling/assets/not_charge.svg',
						title: '中国石油特惠加油',
						describe: `
							ETC一卡双用：通行+加油
							ETC办理成功后，可在指定省份享受中国石油加油优惠0.15-0.2元/升。
							持ETC卡在中石油加油站进行油费充值，使用ETC卡进行加油时即可享受加油折扣优惠。
						`
					}
				]
			}
		],
		showServiceIndex: -1,
		rightsPackageDetails: undefined
	},
	onLoad: async function (options) {
		if (!options.type) {
			// 已选择套餐 && 未支付
			await this.getProductOrderInfo();
			return;
		}
		const packages = app.globalData.newPackagePageData;
		this.setData({
			listOfPackages: parseInt(options.type) === 1 ? packages.divideAndDivideList : packages.alwaysToAlwaysList
		});
		await this.getSwiperHeight();
	},
	onShow () {
	},
	getSwiperHeight: async function () {
		let boxHeight = [];
		const that = this;
		that.data.listOfPackages.map((item, index) => {
			let height = wx.createSelectorQuery();
			height.select(`.item-${index}`).boundingClientRect();
			height.exec(res => {
				boxHeight.push(res[0].height);
				if (boxHeight.length === that.data.listOfPackages.length) {
					that.setData({
						boxHeight
					});
				}
			});
		});
		if (that.data.listOfPackages[0]?.rightsPackageIds?.length) {
			// 获取权益
			await that.getList(that.data.listOfPackages[0]);
		}
	},
	getProductOrderInfo: async function () {
		const result = await util.getDataFromServersV2('consumer/order/get-product-by-order-id', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (result.code === 0) {
			this.setData({
				listOfPackages: [result.data]
			});
			await this.getSwiperHeight();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 选择权益
	onClickDetailsHandle (e) {
		this.setData({
			activeEquitiesIndex: this.data.rightsPackageDetails.index
		});
		this.data.viewRightsAndInterests.switchDisplay(false);
	},
	// 查看权益详情
	showRightsAndInterests (e) {
		let index = e.currentTarget.dataset['index'];
		let rightsPackageDetails = this.data.rightsAndInterestsList[index];
		rightsPackageDetails.index = index;
		this.setData({
			viewRightsAndInterests: this.selectComponent('#showRightsPackage'),
			rightsPackageDetails
		});
		this.data.viewRightsAndInterests.switchDisplay(true);
	},
	onClickClose () {
		this.data.viewRightsService.switchDisplay(false);
	},
	onClickHandle () {
		this.data.viewRightsAndInterests.switchDisplay(false);
	},
	onClickCheckTheService (e) {
		this.setData({
			showServiceIndex: e.currentTarget.dataset.index
		});
		if (this.data.showServiceIndex === 1) return;
		this.setData({
			viewRightsService: this.selectComponent('#viewRightsService')
		});
		this.data.viewRightsService.switchDisplay(true);
	},
	// 获取权益列表
	getList: async function (obj) {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
			packageIds: obj.rightsPackageIds
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				rightsAndInterestsList: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 轮播图滚动后回调
	currentChange (e) {
		console.log(e.detail.current);
		this.setData({
			rightsAndInterestsList: [],
			activeIndex: e.detail.current
		});
	},
	// 点击轮播图
	onClickSwiper: async function (e) {
		let index = e.currentTarget.dataset['index'];
		this.setData({
			rightsAndInterestsList: [],
			choiceIndex: index
		});
		if (this.data.listOfPackages[index]?.rightsPackageIds?.length) {
			// 获取权益
			await this.getList(this.data.listOfPackages[index]);
		}
	},
	next () {
	}
});
