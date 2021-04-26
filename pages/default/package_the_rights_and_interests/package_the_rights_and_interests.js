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
		isRequest: false,// 是否请求中
		orderInfo: undefined,// 订单信息
		listOfPackages: undefined,
		activeIndex: 0,// 当前轮播下标 -- 用于计算轮播高度
		choiceIndex: 0,// 当前选中套餐下标
		activeEquitiesIndex: -1,// 当前选中权益包
		rightsAndInterestsList: [],// 加购权益列表
		basicServiceList: [
			{title: 'ETC设备与卡片', tips: '包邮', logo: '/pages/default/assets/service_of_etc.svg'},
			{title: '设备质保两年', logo: '/pages/default/assets/service_of_equipment.svg'},
			{title: '开具通行费发票', logo: '/pages/default/assets/service_of_invoice.svg'},
			{title: '高速通行9.5折', logo: '/pages/default/assets/service_of_discount.svg'}
		],
		otherServiceList: [
			{title: '车主服务享便捷', subTitle: '价值168元'},
			{title: '生活服务享精彩', subTitle: '价值100元+'}
		],
		characteristicServiceList: [
			{title: '中国石油特惠加油', logo: '/pages/default/assets/service_of_oil.svg'}
			// {title: '高速通行享2倍积分', logo: '/pages/default/assets/service_of_integral.svg'}
		],
		serviceList: [
			{
				detailsTitle: '车主服务',
				list: [
					{
						logo: '/pages/default/assets/service_of_driving_risk.svg',
						title: '每月领驾乘险',
						describe: '10000元初始驾驶意外险，如每月无违章，额外获得5000元，最高可提升至50000元。'
					},
					{
						logo: '/pages/default/assets/service_of_security.svg',
						title: '设备延保1年',
						describe: 'ETC设备非人为损坏质保延长一年，与设备质保叠加最高可达到三年质保。'
					},
					{
						logo: '/pages/default/assets/service_of_illegal.svg',
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
						logo: '/pages/default/assets/service_of_oil.svg',
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
			await this.getOrderInfo();
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
			orderId: app.globalData.orderInfo.orderId,
			needRightsPackageIds: true
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				listOfPackages: [result.data]
			});
			await this.getSwiperHeight();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	getOrderInfo: async function () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '13'
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				orderInfo: result.data
			});
			await this.getProductOrderInfo();
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
			const rightsPackageId = this.data.orderInfo?.base?.rightsPackageId;
			if (rightsPackageId) {
				// 已经加购权益包
				const activeEquitiesIndex = result.data.findIndex(item => item.id === rightsPackageId);
				this.setData({
					activeEquitiesIndex
				});
			}
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
	next: async function () {
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			shopId: this.data.orderInfo ? this.data.orderInfo.base.shopId : app.globalData.newPackagePageData.shopId, // 商户id
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,
			rightsPackageId: this.data.rightsAndInterestsList[this.data.activeEquitiesIndex]?.id || '',
			areaCode: this.data.orderInfo ? this.data.orderInfo.product.areaCode : app.globalData.newPackagePageData.areaCode
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		if (result.code === 0) {
			if (this.data.listOfPackages[this.data.choiceIndex]?.pledgePrice ||
				this.data.rightsAndInterestsList[this.data.activeEquitiesIndex]?.payMoney) {
				await this.marginPayment();
				return;
			}
			util.go('/pages/default/information_list/information_list');
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 支付
	marginPayment: async function () {
		this.setData({isRequest: true});
		util.showLoading();
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		if (!result) {
			this.setData({isRequest: false});
			return;
		}
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg === 'requestPayment:ok') {
						util.go('/pages/default/information_list/information_list');
					} else {
						util.showToastNoIcon('支付失败！');
					}
				},
				fail: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			this.setData({isRequest: false});
			util.showToastNoIcon(result.message);
		}
	}
});
