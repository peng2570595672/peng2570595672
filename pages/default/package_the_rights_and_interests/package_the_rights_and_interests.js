import {thirdContractSigning} from '../../../utils/utils';

/**
 * @author 老刘
 * @desc 选择套餐
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		topProgressBar: 2,	// 进度条展示的长度 ，再此页面的取值范围 [2,3),默认为2,保留一位小数
		isFade: true,
		activeIndex: 0,
		isCloseUpperPart: false, // 控制 详情是否显示
		isCloseUpperPart1: false, // 控制 详情是否显示
		isCloseUpperPart2: false, // 控制 详情是否显示
		nodeHeightList: [], // 存储节点高度 集合
		phoneType: 2,
		equityListMap: [],	// 权益列表集合
		ttCouponImgList: [	// 通通券图片展示
			{img: 'https://file.cyzl.com/g001/M01/CA/91/oYYBAGP9r8KAadO3AAAhbDu7b-c635.png'},
			{img: 'https://file.cyzl.com/g001/M01/CA/92/oYYBAGP9r9eAbYMrAAAfwNWjlCE671.png'},
			{img: 'https://file.cyzl.com/g001/M01/CA/92/oYYBAGP9r-KAOszNAAAg2fHzpLY270.png'}
		],
		// ------------------------------------------------------------------------------
		isContinentInsurance: app.globalData.isContinentInsurance,// 是否是大地
		isSelected: false,// 是否选中当前权益包
		isSalesmanOrder: false,// 是否是业务员端办理
		isRequest: false,// 是否请求中
		orderInfo: undefined,// 订单信息
		listOfPackages: undefined,
		// activeIndex: 0,// 当前轮播下标 -- 用于计算轮播高度
		choiceIndex: 0,// 当前选中套餐下标
		activeEquitiesIndex: -1,// 当前选中权益包
		rightsAndInterestsList: [],// 加购权益列表
		basicServiceList: [
			{title: 'ETC设备与卡片', tips: '包邮', icos: 'service_of_etc'},
			{title: '设备质保一年', icos: 'service_of_equipment'},
			{title: '开具通行费发票', icos: 'service_of_invoice'},
			{title: '高速通行9.5折', icos: 'service_of_discount'}
		],
		otherServiceList: [
			{title: '车主服务享便捷', subTitle: '价值168元'},
			{title: '生活服务享精彩', subTitle: '价值100元+'}
		],
		characteristicServiceList: [
			{title: '中国石油特惠加油', ico: 'service_of_oil', logo: '/pages/default/assets/service_of_oil.svg'}
			// {title: '高速通行享2倍积分', ico: 'service_of_integral', logo: '/pages/default/assets/service_of_integral.svg'}
		],
		serviceList: [
			{
				detailsTitle: '车主服务',
				list: [
					{
						ico: 'service_of_high_speed',
						title: '领高速补贴 ',
						describe: '高速公路非事故救援服务费用补贴，含拖车、接电等，累计最高500元。',
						isShow: !app.globalData.isContinentInsurance
					},
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
							'/pages/default/assets/life_of_tencent_video.svg',
							'/pages/default/assets/life_of_aiqiyi.svg',
							'/pages/default/assets/life_of_tudou.svg',
							'/pages/default/assets/life_of_mangguo.svg'
						]
					},
					{
						title: '各大音频会员充值5折起',
						logoList: [
							'/pages/default/assets/life_of_qq_music.svg',
							'/pages/default/assets/life_of_xmly.svg'
						]
					},
					{
						title: '大牌美食优惠持续上新',
						logoList: [
							'/pages/default/assets/life_of_elm.svg'
						]
					}
				]
			},
			{
				detailsTitle: '特色服务',
				list: [
					{
						// ico: 'service_of_oil',
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
		rightsPackageDetails: undefined,
		contractStatus: undefined,
		getAgreement: false, // 是否接受协议
		isPay: false, // 已选择通通券套餐&无需支付||已经支付
		isTest: app.globalData.test
	},
	async onLoad (options) {
		console.log(options);
		app.globalData.isTelemarketing = false;
		this.setData({
			contractStatus: +options.contractStatus
		});
		if (!options.type) {
			// 已选择套餐 && 未支付
			await this.getOrderInfo();
			return;
		}
		const packages = app.globalData.newPackagePageData;
		this.setData({
			listOfPackages: parseInt(options.type) === 1 ? packages.divideAndDivideList : packages.alwaysToAlwaysList
		});
		// await this.getSwiperHeight();
		// 获取 套餐模块的高度
		this.getNodeHeight(this.data.listOfPackages.length);
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow (res) {
		if (app.globalData.signAContract === -1) {
			this.queryContract();
		}
		if (app.globalData.signTongTongQuanAContract === 1) {
			app.globalData.signTongTongQuanAContract = 0;
			this.getOrderInfo(false);
		}
	},
	// async getSwiperHeight () {
	// 	let boxHeight = [];
	// 	const that = this;
	// 	that.data.listOfPackages.map((item, index) => {
	// 		let height = wx.createSelectorQuery();
	// 		height.select(`.item-${index}`).boundingClientRect();
	// 		height.exec(res => {
	// 			boxHeight.push(res[0].height);
	// 			if (boxHeight.length === that.data.listOfPackages.length) {
	// 				that.setData({
	// 					boxHeight
	// 				});
	// 			}
	// 		});
	// 	});
	// 	if (that.data.listOfPackages[0]?.rightsPackageIds?.length) {
	// 		console.log(that.data.listOfPackages[0]);
	// 		// 获取权益
	// 		await that.getList(that.data.listOfPackages[0]);
	// 	}
	// },
	// 获取 套餐信息
	async getProductOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-product-by-order-id', {
			orderId: app.globalData.orderInfo.orderId,
			needRightsPackageIds: true
		});
		console.log(result);
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				listOfPackages: [result.data]
			});
			this.getNodeHeight(this.data.listOfPackages.length);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async getOrderInfo (initProduct = true, isSearchPay = false) {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '13'
		});
		console.log(result);
		if (!result) return;
		if (result.code === 0) {
			if (isSearchPay) {
				if (result.data.product?.ttDeductStatus === 0) {
					util.go('/pages/default/payment_fail/payment_fail?type=main_process');
				} else {
					this.submitOrder();
				}
				return;
			}
			this.setData({
				isPay: result.data.product?.shopProductId && (result.data.base?.pledgeStatus === -1 || result.data.base?.pledgeStatus === 1),
				isSalesmanOrder: result.data.base.orderType === 31,
				orderInfo: result.data
			});
			if (result.data.product?.ttContractStatus === 1 && result.data.product?.ttDeductStatus !== 1) {
				// 签约通通券1有 0未   通通券扣款情况1有 0未  2失败
				// 发起扣款
				util.showToastNoIcon('签约成功');
				await this.deductByContractThird();
			}
			if (initProduct) {
				await this.getProductOrderInfo();
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 发起通通券扣款
	async deductByContractThird () {
		const result = await util.getDataFromServersV2('consumer/order/deductByContractThird', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.getOrderInfo(false, true);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 查询车主服务签约
	async queryContract () {
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.signAContract = 3;
			if (result.data.contractStatus === 1) {
				util.showToastNoIcon('签约成功');
				let ttCouponPayAmount = parseInt(this.data.listOfPackages[this.data.choiceIndex].ttCouponPayAmount);
				let isSignTtCoupon = parseInt(this.data.listOfPackages[this.data.choiceIndex].isSignTtCoupon);
				let shopProductId = this.data.listOfPackages[this.data.choiceIndex].shopProductId;
				let falgs = this.data.isTest ? shopProductId === '1053333932522610688' : shopProductId === '1060638877005914112';
				if (ttCouponPayAmount === 0 && isSignTtCoupon === 1 && falgs) {
					this.submitOrder();
				}
			}
			this.setData({
				contractStatus: result.data.contractStatus
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async handleSign () {
		if (!this.data.getAgreement) {
			util.showToastNoIcon('请同意并勾选协议！');
			return;
		}
		if (this.data.contractStatus === 1) {
			// 签约通通券代扣
			await this.signThirdContract();
			return;
		}
		await this.signWeChat();
	},
	// 通通券金额为 0 时，调用此接口
	toWeChatSign () {
		if (!this.data.getAgreement) {
			util.showToastNoIcon('请同意并勾选协议！');
			return;
		}
		this.weChatSign();
	},
	async signThirdContract () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading('加载中');
		let params = {
			orderId: app.globalData.orderInfo.orderId // 订单id
		};
		const result = await util.getDataFromServersV2('consumer/order/thirdContract', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			// 签约通通券代扣 1.0
			app.globalData.signTongTongQuanAContract = 1;
			thirdContractSigning(result.data);
		} else if (result.code === 300) {
			// 已签约
			app.globalData.signAContract = 3;
			this.setData({
				contractStatus: 1
			});
			await this.deductByContractThird();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 提交订单
	async submitOrder () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}&type=main_process`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 微信签约
	async signWeChat () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否,// 已完善资料,进入待审核
			orderId: app.globalData.orderInfo.orderId,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.signAContract = -1;
			app.globalData.belongToPlatform = app.globalData.platformId;
			app.globalData.isNeedReturnHome = false;
			util.weChatSigning(res);
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
		if (this.data.listOfPackages[this.data.choiceIndex]?.mustChoiceRightsPackage === 1) {
			const index = this.data.rightsAndInterestsList.findIndex(item => item.id === this.data.listOfPackages[0]?.rightsPackageIds[0]);
			if (index !== -1 && this.data.choiceIndex !== -1) {
				this.setData({
					activeEquitiesIndex: index
				});
			}
		}
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
	// 查看办理协议
	onClickGoAgreementHandle () {
		const item = this.data.listOfPackages[this.data.choiceIndex];
		if (item.etcCardId === 1) {
			// serviceFeeType  是否收取权益服务费：0否，1是
			return util.go('/pages/default/equity_agreement/equity_agreement');
		}
		// 1-自购设备 2-免费设备 3-自购(其他)
		if (item?.environmentAttribute === 2) {
			util.go(`/pages/default/agreement/agreement`);
		} else {
			util.go(`/pages/default/new_self_buy_equipmemnt_agreement/index`);
		}
		// if (item.pledgeType === 4) {
		// 	// ETC押金办理模式 协议
		// 	return util.go('/pages/default/margin_user_handling_agreement/margin_user_handling_agreement');
		// }
		// // 1-自购设备 2-免费设备 3-自购(其他)
		// if (item?.environmentAttribute === 2) {
		// 	if (item.etcCardId === 1) {
		// 		util.go(`/pages/default/free_equipment_agreement/free_equipment_agreement`);
		// 	} else {
		// 		util.go(`/pages/default/agreement/agreement`);
		// 	}
		// } else {
		// 	if (item.isSignTtCoupon === 1) {
		// 		util.go(`/pages/default/self_buy_equipmemnt_agreement/self_buy_equipmemnt_agreement`);
		// 	} else {
		// 		util.go(`/pages/default/new_self_buy_equipmemnt_agreement/index`);
		// 	}
		// }
	},
	// 黔通用户协议
	onClickGoQianTongAgreement () {
		util.go('/pages/truck_handling/agreement_for_qiantong_to_charge/agreement');
	},
	// 通通券协议
	onClickGoTTQAgreement1 () {
		util.go('/pages/default/coupon_agreement/coupon_agreement');
	},
	// 查看隐私协议
	onClickGoPrivacyHandle () {
		util.go('/pages/default/privacy_agreement/privacy_agreement');
	},
	// 是否接受协议   点击同意协议并且跳转指定套餐模块
	onClickAgreementHandle () {
		if (this.data.activeIndex === -1) {
			return util.showToastNoIcon('亲，请选套餐哦');
		}
		let getAgreement = !this.data.getAgreement;
		this.setData({
			getAgreement,
			topProgressBar: getAgreement ? 2.7 : 2.4
		});
		// 跳转指定套餐模块
		this.controllShopProductPosition(this.data.activeIndex);
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
		if (!obj.rightsPackageIds?.length) return;
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
			packageIds: obj.rightsPackageIds
		});
		console.log(result);
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
			} else {
				if (this.data.listOfPackages[0]?.mustChoiceRightsPackage === 1) {
					const index = result.data.findIndex(item => item.id === this.data.listOfPackages[0]?.rightsPackageIds[0]);
					if (index !== -1 && this.data.choiceIndex !== -1) {
						this.setData({
							activeEquitiesIndex: index
						});
					}
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
		if (!this.data.getAgreement) {
			util.showToastNoIcon('请同意并勾选协议！');
			return;
		}
		if (this.data.listOfPackages[this.data.choiceIndex].pledgeType === 4) {
			// 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理，如果有则弹窗提示，并且不执行后面流程
			const result = await util.getDataFromServersV2('consumer/order/precharge/list',{
				orderId: app.globalData.orderInfo.orderId // 订单id
			});
			if (!result) return;
			if (result.code === 0) {
				if (result.data.length > 5) {
					util.alert({
						title: `提示`,
						content: `该套餐目前暂只支持单人办理五台车辆`,
						confirmColor: '#576B95',
						cancelColor: '#000000',
						cancelText: '我知道了',
						confirm: () => {
						},
						cancel: async () => {
						}
					});
					return;
				}
			} else {
				util.showToastNoIcon(result.message);
				return;
			}
		}

		if (this.data.listOfPackages[this.data.choiceIndex].mustChoiceRightsPackage === 0 && this.data.rightsAndInterestsList.length) {
			// 不必选权益 有权益包 未选中权益包
			util.alert({
				title: `优惠提醒`,
				content: `73%的用户都选择加购券权益，你确定要放弃吗？`,
				showCancel: true,
				confirmColor: '#576B95',
				cancelColor: '#000000',
				cancelText: '确认放弃',
				confirmText: '我再看看',
				confirm: () => {
				},
				cancel: async () => {
					await this.saveOrderInfo();
				}
			});
			return;
		}
		await this.saveOrderInfo();
	},
	// 提交订单
	async saveOrderInfo () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		wx.uma.trackEvent('package_the_rights_and_interests_next');
		const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
			orderId: app.globalData.orderInfo.orderId // 订单id
		});
		if (!res) return;
		this.setData({isRequest: false});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			shopId: this.data.orderInfo ? this.data.orderInfo.base.shopId : app.globalData.newPackagePageData.shopId, // 商户id
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,
			rightsPackageId: this.data.equityListMap[this.data.activeIndex]?.id || '',
			areaCode: this.data.orderInfo ? (this.data.orderInfo.product.areaCode || '0') : app.globalData.newPackagePageData.areaCode
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			if (this.data.listOfPackages[this.data.choiceIndex]?.pledgePrice ||
				this.data.equityListMap[this.data.activeIndex]?.payMoney) {
				await this.marginPayment(this.data.listOfPackages[this.data.choiceIndex].pledgeType);
				return;
			}
			if (this.data.orderInfo?.base?.orderType === 61) {
				// 电销&无需支付
				await this.perfectOrder();
				return;
			}
			if (this.data.isSalesmanOrder) {
				await this.getSalesmanOrderProcess();
				return;
			}
			util.go('/pages/default/information_list/information_list?type=1');
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async perfectOrder () {
		app.globalData.isTelemarketing = true;
		let params = {
			dataComplete: 1,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId,// 订单id
			changeAuditStatus: true,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		if (result.code === 0) {
			app.globalData.signAContract = -1;
			app.globalData.belongToPlatform = app.globalData.platformId;
			let res = result.data.contract;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取业务员端流程
	async getSalesmanOrderProcess () {
		if (this.data.orderInfo.base?.flowVersion === 1) {
			// 去签约
			await this.weChatSign();
		}
		if (this.data.orderInfo.base?.flowVersion === 2 || this.data.orderInfo.base?.flowVersion === 3) {
			// 去银行签约
			util.go('/pages/default/transition_page/transition_page');
		}
	},
	// 微信签约
	async weChatSign () {
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		if (result.code === 0) {
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.signAContract = -1;
			app.globalData.belongToPlatform = app.globalData.platformId;
			app.globalData.isNeedReturnHome = true;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 支付
	async marginPayment (pledgeType) {
		if (this.data.isRequest) return;
		this.setData({isRequest: true});
		util.showLoading();
		console.log(this.data.listOfPackages);
		let params = {};
		if (pledgeType === 4) {
			// 押金模式
			params = {
				payVersion: 'v3',
				tradeType: 1,
				orderId: app.globalData.orderInfo.orderId,
				openid: app.globalData.openId
			};
		} else {
			// 普通模式
			params = {
				orderId: app.globalData.orderInfo.orderId
			};
		}
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		console.log(result);
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
							if (this.data.orderInfo.base?.flowVersion !== 1) {
								// 无需签约
								util.go('/pages/default/transition_page/transition_page');
								return;
							}
							if (this.data.listOfPackages[this.data.choiceIndex].isSignTtCoupon === 1) {
								// 通通券套餐
								this.setData({isPay: true});
								return;
							}
							// 去支付成功页
							util.go('/pages/default/payment_successful/payment_successful');
							return;
						}
						if (this.data.orderInfo?.base?.orderType === 61) {
							// 电销模式
							this.perfectOrder();
							return;
						}
						util.go('/pages/default/information_list/information_list?type=1');
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
	},
	// ------------------------------------------------------------------------------------------------------------------
	// 前去相关协议页面
	goAgreement () {
		console.log('前去相关协议');
		util.go('/pages/personal_center/user_agreement/user_agreement');
	},
	// 权益点击高亮，不用显示详情弹窗
	detailsBtn (e) {
		if (this.data.listOfPackages[this.data.activeIndex]?.mustChoiceRightsPackage === 1) {
			return;
		}
		const index = e.currentTarget.dataset.index;
		if (this.data.activeEquitiesIndex !== index) {
			this.setData({
				activeEquitiesIndex: index
			});
		} else {
			this.setData({
				activeEquitiesIndex: -1
			});
		}
	},
	// 点击高亮
	btnHeightLight (e) {
		let that = this;
		let isFade = e.currentTarget.dataset.index !== that.data.activeIndex;
		// 控制点击 套餐高亮
		that.setData({
			isFade,
			activeIndex: isFade ? e.currentTarget.dataset.index : -1,
			getAgreement: false,
			topProgressBar: isFade ? 2.4 : 2,
			choiceIndex: isFade ? e.currentTarget.dataset.index : -1
		});
		if (isFade) { // 当套餐高亮时，默认展开 详情
			this.setData({
				isCloseUpperPart1: true,
				isCloseUpperPart2: false
			});
		} else {
			this.setData({
				isCloseUpperPart: e.currentTarget.dataset.index,
				isCloseUpperPart1: false,
				isCloseUpperPart2: false
			});
		}
		// 点击套餐 让套餐模块置顶 一定的距离
		if (!isFade) {
			return false;
		} else {
			this.controllShopProductPosition(e.currentTarget.dataset.index);
		}
	},
	btnOpenOrOff (e) { // 展开和收起
		let index = e.currentTarget.dataset.index[0];
		let activeIndex = e.currentTarget.dataset.index[2];
		let isCloseUpperPart = e.currentTarget.dataset.index[1];
		let flag = this.data.isCloseUpperPart1;
		let flag2 = this.data.isCloseUpperPart2;
		if (index === activeIndex) { // 选中套餐 点击 展开和收起 的控制
			this.setData({
				isCloseUpperPart1: !flag,
				isCloseUpperPart2: isCloseUpperPart !== index ? false : !flag2
			});
		} else { // 未选中套餐 点击 展开和收起 的控制
			this.setData({
				isCloseUpperPart: index,
				isCloseUpperPart1: false,
				isCloseUpperPart2: isCloseUpperPart !== index ? true : !flag2
			});
		}
	},
	// 获取节点的高度
	async getNodeHeight (num) {
		console.log(num);
		util.showLoading({
			title: '加载中'
		});
		let that = this;
		let nodeHeightList = [];
		let equityListMap = [];
		for (let index = 0; index < num; index++) {
			let allIndex = 'module' + index;
			wx.createSelectorQuery().select(`.${allIndex}`).boundingClientRect(function (rect) {
				nodeHeightList.push(rect.top);
				console.log('节点距离顶部高度列表：',nodeHeightList);
				that.setData({
					nodeHeightList
				});
			}).exec();
			const packageIds = this.data.listOfPackages[index].rightsPackageIds.length > 1 ? new Array(this.data.listOfPackages[index].rightsPackageIds[0]) : this.data.listOfPackages[index].rightsPackageIds;
			if (!packageIds?.length) {
				let equityObj = {index: index, packageName: '',payMoney: 0};
				equityListMap.push(equityObj);
			} else {
				const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
					packageIds: packageIds
				},'POST',false);
				if (result.code === 0) {
					let equityObj = {index: index, packageName: result.data[0].packageName,payMoney: result.data[0].payMoney,id: result.data[0].id};
					equityListMap.push(equityObj);
				} else {
					// 占位
					let equityObj = {index: index, packageName: '',payMoney: 0};
					equityListMap.push(equityObj);
				}
			}
		}
		this.setData({
			equityListMap: equityListMap
		});
		util.hideLoading();
	},
	// 控制 选中套餐 的位置
	controllShopProductPosition (eIndex) {
		let flags = 'module' + eIndex;
		let that = this;
		wx.pageScrollTo({
			selector: `.${flags}`,
			scrollTop: that.data.nodeHeightList[that.data.activeIndex] - (that.data.nodeHeightList[0] + 4),
			duration: 200
		});
	}
});
