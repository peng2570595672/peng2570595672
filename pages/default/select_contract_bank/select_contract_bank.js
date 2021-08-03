/**
 * @author xdx
 * @desc 选择银行套餐
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		basicServiceList: [
			{title: 'ETC设备与卡片', tips: '包邮', ico: 'service_of_etc'},
			{title: '设备质保两年', ico: 'service_of_equipment'},
			{title: '开具通行费发票', ico: 'service_of_invoice'},
			{title: '高速通行9.5折', ico: 'service_of_discount'}
		],
		listOfPackages: [], // 套餐列表
		isSelected: false,// 是否选中当前权益包
		activeEquitiesIndex: -1,// 当前选中权益包
		rightsAndInterestsList: [],// 加购权益列表
		choiceIndex: -1 //  当前选中套餐下标
	},
	async onLoad () {
		const packages = app.globalData.newPackagePageData;
		this.setData({
			listOfPackages: packages.alwaysToAlwaysList
		});
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
	},
	// 获取权益列表
	async getList (obj) {
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
				if (this.data.isSalesmanOrder) {
					// 只显示选购权益包 没加购权益包则影藏权益
					const index = activeEquitiesIndex === -1 ? -1 : 0;
					const list = activeEquitiesIndex === -1 ? [] : [result.data[activeEquitiesIndex]];
					this.setData({
						activeEquitiesIndex: index,
						rightsAndInterestsList: list
					});
				} else {
					this.setData({
						activeEquitiesIndex
					});
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async chooseBank (e) {
		let index = e.currentTarget.dataset.index;
		let id = e.currentTarget.dataset.id;
		this.setData({
			choiceIndex: index
		});
		let obj = this.data.listOfPackages[index];
		if (obj?.rightsPackageIds?.length) await this.getList(obj);
	},
	// 选择权益
	onClickDetailsHandle (e) {
		this.setData({
			isSelected: false,
			activeEquitiesIndex: e.detail.isSelected ? -1 : this.data.rightsPackageDetails.index
		});
	},
	// 查看权益详情
	showRightsAndInterests (e) {
		let index = e.currentTarget.dataset['index'];
		let rightsPackageDetails = this.data.rightsAndInterestsList[index];
		rightsPackageDetails.index = index;
		const isSelected = this.data.activeEquitiesIndex === index;
		util.go(`/pages/default/prefer_purchase/prefer_purchase?rightsId=${rightsPackageDetails.id}&isSelected=${isSelected}`);
	},
	async next () {
		if (this.data.choiceIndex === -1) return;
		if (this.data.listOfPackages[this.data.choiceIndex].mustChoiceRightsPackage === 1 && this.data.activeEquitiesIndex === -1) {
			util.showToastNoIcon('套餐需加购权益包');
			// 必须选择权益
			return;
		}
		wx.uma.trackEvent('package_the_rights_and_interests_next');
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
	async marginPayment () {
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
						if (this.data.isSalesmanOrder) {
							// 去支付成功页
							util.go('/pages/default/payment_successful/payment_successful');
							return;
						}
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
