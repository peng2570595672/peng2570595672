/**
 * @author 老刘
 * @desc 选择套餐
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isSelected: false,// 是否选中当前权益包
		isSalesmanOrder: false,// 是否是业务员端办理
		isRequest: false,// 是否请求中
		orderInfo: undefined,// 订单信息
		listOfPackages: undefined,
		activeIndex: 0,// 当前轮播下标 -- 用于计算轮播高度
		choiceIndex: 0,// 当前选中套餐下标
		activeEquitiesIndex: -1,// 当前选中权益包
		rightsAndInterestsList: [],// 加购权益列表
		basicServiceList: [
			{title: 'ETC设备与卡片', tips: '包邮', ico: 'service_of_etc'},
			{title: '设备质保两年', ico: 'service_of_equipment'},
			{title: '开具通行费发票', ico: 'service_of_invoice'},
			{title: '高速通行9.5折', ico: 'service_of_discount'}
		],
		otherServiceList: [
			{title: '车主服务享便捷', subTitle: '价值168元'},
			{title: '生活服务享精彩', subTitle: '价值100元+'}
		],
		characteristicServiceList: [
			{title: '中国石油特惠加油', ico: 'service_of_oil', logo: 'https://file.cyzl.com/g001/M02/19/6A/oYYBAGVdqimAfsekAAANOgAA3Ug751.svg'}
			// {title: '高速通行享2倍积分', ico: 'service_of_integral', logo: '/pages/default/assets/service_of_integral.svg'}
		],
		serviceList: [
			{
				detailsTitle: '车主服务',
				list: [
					{
						ico: 'service_of_driving_risk',
						title: '每月领驾驶险',
						describe: '10000元初始驾驶意外险，如每月无违章，额外获得5000元，最高可提升至50000元。',
						isShow: !app.globalData.isContinentInsurance
					},
					{
						ico: 'service_of_security',
						title: '设备延保1年',
						describe: 'ETC设备非人为损坏质保延长一年，与设备质保叠加最高可达到三年质保。',
						isShow: true
					},
					{
						ico: 'service_of_illegal',
						title: '违章随时查',
						describe: '每月可免费查询车辆违章情况',
						isShow: !app.globalData.isContinentInsurance
					},
					{
						ico: 'service_of_oil',
						title: '优惠加油',
						describe: '全国加油9折起',
						isShow: true
					}
				]
			},
			{
				detailsTitle: '生活服务',
				detailsSubTitle: '享受以下虚拟商品特惠在线充值',
				list: [
					{
						title: '各大视频会员充值4.5折起',
						logoList: [
							'https://file.cyzl.com/g001/M02/19/6F/oYYBAGVdtMCATIsQAAAKRkHdarM591.svg',
							'https://file.cyzl.com/g001/M02/19/6D/oYYBAGVdsESAPu6UAAAskKqRn0U979.svg',
							'https://file.cyzl.com/g001/M02/19/6F/oYYBAGVds_6AWEIWAAAWVFq7sZc523.svg',
							'https://file.cyzl.com/g001/M02/19/6F/oYYBAGVdtDSAIHogAAAQIMcMJJY418.svg'
						]
					},
					{
						title: '各大音频会员充值5折起',
						logoList: [
							'https://file.cyzl.com/g001/M02/19/6D/oYYBAGVdsHKAQGG8AAAgefm1PGM764.svg',
							'https://file.cyzl.com/g001/M02/19/6D/oYYBAGVdsAeANnetAABMyxbFcmc740.svg'
						]
					},
					{
						title: '大牌美食优惠持续上新',
						logoList: [
							'https://file.cyzl.com/g001/M02/19/6F/oYYBAGVdtJiAXR7LAAAKt045law708.svg'
						]
					}
				]
			},
			{
				detailsTitle: '特色服务',
				list: [
					{
						// ico: 'service_of_oil',
						logo: 'https://file.cyzl.com/g001/M02/19/6A/oYYBAGVdqimAfsekAAANOgAA3Ug751.svg',
						title: '中国石油特惠加油',
						describe: `
							ETC一卡双用：通行+加油
							ETC办理成功后，可在指定省份享受中国石油加油优惠0.15-0.2元/升。
							持ETC卡在中石油加油站进行油费充值，使用ETC卡进行加油时即可享受加油折扣优惠。
						`
					}
					// {
					// 	ico: 'service_of_integral',
					// 	logo: '/pages/default/assets/service_of_integral.svg',
					// 	title: '高速通行享2倍积分',
					// 	describe: `
					// 	`
					// }
				]
			}
		],
		showServiceIndex: -1,
		rightsPackageDetails: undefined,
		getAgreement: false // 是否接受协议
	},
	async onLoad (options) {
		if (!options.type) {
			// 已选择套餐 && 未支付
			await this.getOrderInfo();
			return;
		}
		const packages = app.globalData.newPackagePageData;
		this.setData({
			listOfPackages: packages.listOfPackages
		});
		await this.getSwiperHeight();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
	},
	async getSwiperHeight () {
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
	async getProductOrderInfo () {
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
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '13'
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				isSalesmanOrder: result.data.base.orderType === 31,
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
			isSelected: false,
			activeEquitiesIndex: e.detail.isSelected ? -1 : this.data.rightsPackageDetails.index
		});
		this.data.viewRightsAndInterests.switchDisplay(false);
	},
	// 查看权益详情
	showRightsAndInterests (e) {
		if (this.data.isSalesmanOrder) return;
		let index = e.currentTarget.dataset['index'];
		let rightsPackageDetails = this.data.rightsAndInterestsList[index];
		rightsPackageDetails.index = index;
		const isSelected = this.data.activeEquitiesIndex === index;
		this.setData({
			isSelected,
			viewRightsAndInterests: this.selectComponent('#showRightsPackage'),
			rightsPackageDetails
		});
		this.data.viewRightsAndInterests.switchDisplay(true);
	},
	onClickClose () {
		this.data.viewRightsService?.switchDisplay(false);
		this.data.viewLifeService?.switchDisplay(false);
	},
	onClickHandle () {
		this.data.viewRightsAndInterests.switchDisplay(false);
	},
	// 黔通用户协议
	onClickGoQianTongAgreement () {
		let path = 'free';
		// 1-自购设备 2-免费设备
		if (this.data.listOfPackages[this.data.choiceIndex]?.environmentAttribute === 1) {
			path = 'charge';
		}
		util.go(`/pages/truck_handling/agreement_for_qiantong_to_${path}/agreement`);
	},
	// 个人征信授权书
	onClickGoAuthorizationHandle () {
		util.go('/pages/truck_handling/truck_credit_investigation_authorization/truck_credit_investigation_authorization');
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		if (this.data.listOfPackages[this.data.choiceIndex].flowVersion === 7) {
			util.go('/pages/truck_handling/bocom_handle_protocol/bocom_handle_protocol');
		} else {
			util.go('/pages/truck_handling/agreement/agreement');
		}
	},
	// 查看保理
	onClickGoFactoring () {
		util.go('/pages/default/agreement_for_factoring/agreement');
	},
	// 查看隐私协议
	onClickGoPrivacyHandle () {
		util.go('/pages/agreement_documents/privacy_agreement/privacy_agreement');
	},
	// 是否接受协议
	onClickAgreementHandle () {
		this.setData({
			getAgreement: !this.data.getAgreement
		});
	},
	onClickCheckTheService (e) {
		this.setData({
			showServiceIndex: parseInt(e.currentTarget.dataset.index)
		});
		if (this.data.showServiceIndex === 2) return;
		if (this.data.showServiceIndex === 1) {
			this.setData({
				viewLifeService: this.selectComponent('#viewLifeService')
			});
			this.data.viewLifeService.switchDisplay(true);
			return;
		}
		this.setData({
			viewRightsService: this.selectComponent('#viewRightsService')
		});
		this.data.viewRightsService.switchDisplay(true);
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
	// 轮播图滚动后回调
	async currentChange (e) {
		this.setData({
			isSelected: false,
			choiceIndex: -1,
			activeEquitiesIndex: -1,
			rightsAndInterestsList: [],
			activeIndex: e.detail.current
		});
		if (this.data.listOfPackages[this.data.activeIndex]?.rightsPackageIds?.length) {
			// 获取权益
			await this.getList(this.data.listOfPackages[this.data.activeIndex]);
		}
	},
	// 点击轮播图
	async onClickSwiper (e) {
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
	async next () {
		if (this.data.choiceIndex === -1) return;
		if (this.data.listOfPackages[this.data.choiceIndex].mustChoiceRightsPackage === 1 && this.data.activeEquitiesIndex === -1) {
			util.showToastNoIcon('套餐需加购权益包');
			// 必须选择权益
			return;
		}
		if (!this.data.getAgreement) {
			util.showToastNoIcon('请同意并勾选协议！');
			return;
		}
		const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
			orderId: app.globalData.orderInfo.orderId // 订单id
		});
		if (!res) return;
		wx.uma.trackEvent('truck_for_package_the_rights_and_interests_next');
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
			if (this.data.isSalesmanOrder && this.data.listOfPackages[this.data.choiceIndex].flowVersion !== 7) {
				util.go('/pages/default/processing_progress/processing_progress?type=main_process');
				return;
			}
			if (this.data.isSalesmanOrder && this.data.listOfPackages[this.data.choiceIndex].flowVersion === 7) {
				let checkResults;
				if (app.globalData.memberStatusInfo?.orderBankConfigList?.length) {
					checkResults = app.globalData.memberStatusInfo.orderBankConfigList.find(item => item.orderId === app.globalData.orderInfo.orderId);
				}
				if (!checkResults?.uploadImageStatus) {
					// 未影像资料上送
					await this.truckUploadImg();
					return;
				} else {
					if (!checkResults?.isTencentVerify) {
						// 未上送腾讯云活体人脸核身核验成功
						util.go(`/pages/truck_handling/face_of_check_tips/face_of_check_tips`);
						return;
					}
					let info;
					if (app.globalData.memberStatusInfo?.accountList?.length) {
						info = app.globalData.memberStatusInfo.accountList.find(item => item.orderId === app.globalData.orderInfo.orderId);
					}
					if (!info?.memberBankId) {
						// 未开户
						util.go(`/pages/truck_handling/binding_account_bocom/binding_account_bocom`);
						return;
					}
					util.go('/pages/truck_handling/signed/signed');
				}
				return;
			}
			util.go('/pages/truck_handling/information_list/information_list');
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 影像资料上送
	async truckUploadImg () {
		const result = await util.getDataFromServersV2('consumer/member/bcm/truckUploadImg', {
			orderId: app.globalData.orderInfo.orderId// 订单id
		});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/truck_handling/face_of_check_tips/face_of_check_tips`);
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
				success: async (res) => {
					this.setData({isRequest: false});
					if (res.errMsg === 'requestPayment:ok') {
						if (this.data.isSalesmanOrder) {
							if (this.data.listOfPackages[this.data.choiceIndex].flowVersion === 5) {
								// 去支付成功页
								const result = await util.getDataFromServersV2('consumer/member/icbcv2/getV2BankId');
								if (!result) return;
								if (result.code) {
									util.showToastNoIcon(result.message);
									return;
								}
								const path = result.data?.accountNo ? 'contract_management' : 'binding_account';
								util.go(`/pages/truck_handling/${path}/${path}`);
								return;
							}
							if (this.data.listOfPackages[this.data.choiceIndex].flowVersion === 4) {
								util.go('/pages/default/processing_progress/processing_progress?type=main_process');
								return;
							}
						}
						util.go('/pages/truck_handling/information_list/information_list');
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
