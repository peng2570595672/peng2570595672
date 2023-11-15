/**
 * 业务员空发套餐选择
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
		nodeHeightList: [], // 存储节点距离top 集合
		phoneType: 2,
		equityListMap: [],	// 权益列表集合
		ttCouponImgList: [	// 通通券图片展示
			{img: 'https://file.cyzl.com/g001/M01/CA/91/oYYBAGP9r8KAadO3AAAhbDu7b-c635.png'},
			{img: 'https://file.cyzl.com/g001/M01/CA/92/oYYBAGP9r9eAbYMrAAAfwNWjlCE671.png'},
			{img: 'https://file.cyzl.com/g001/M01/CA/92/oYYBAGP9r-KAOszNAAAg2fHzpLY270.png'}
		],
		// ------------------------------------------------------------------------------
		isSalesmanOrder: false,// 是否是业务员端办理
		isRequest: false,// 是否请求中
		orderInfo: undefined,// 订单信息
		listOfPackages: undefined,
		choiceIndex: 0,// 当前选中套餐下标
		activeEquitiesIndex: -1,// 当前选中权益包
		rightsAndInterestsList: [],// 加购权益列表
		basicServiceList: [
			{title: 'ETC设备与卡片', tips: '包邮', icos: 'service_of_etc'},
			{title: '设备质保一年', icos: 'service_of_equipment'},
			{title: '开具通行费发票', icos: 'service_of_invoice'},
			{title: '高速通行9.5折', icos: 'service_of_discount'}
		],
		basicServiceListNM: [
			{title: 'ETC设备（第五代）', tips: '包邮', icos: 'service_of_etc'},
			{title: '设备质保三年', icos: 'service_of_equipment'},
			{title: '开具通行费发票', icos: 'service_of_invoice'},
			{title: '高速通行9.5折', icos: 'service_of_discount'}
		],
		orderId: '',
		contractStatus: undefined,
		isLoaded: false, // 是否加载数据完成
		getAgreement: false, // 是否接受协议
		isPay: false, // 已选择通通券套餐&无需支付||已经支付
        isOnloadData: true,
		citicBank: false,	// 是否是中信银行联名套餐
		emptyHairOrder: true,	// 为true表示是空发订单
		citicBankshopProductIds: app.globalData.cictBankObj.citicBankshopProductIds,	// 信用卡套餐集合
		roadRescueShopProductId: app.globalData.isTest ? '1049360146769125376' : ''	// 道路救援套餐ID
    },
    async onLoad (options) {
		this.setData({
			shopProductId: options.shopProductId
		});
        if (app.globalData.userInfo.accessToken) {
            // 根据套餐id查询套餐信息
            await this.getProduct();
            await this.getOrderInfo();
        } else {
            this.setData({
                isOnloadData: false
            });
            this.login();
        }
    },
    async onShow () {
        if (!this.data.isOnloadData) {
            // 根据套餐id查询套餐信息
            await this.getProduct();
        }
	},

	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (!result) return;
				if (result.code) {
					util.showToastNoIcon(result.message);
					return;
				}
				result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				// 已经绑定了手机号
				if (result.data.needBindingPhone !== 1) {
					app.globalData.userInfo = result.data;
					app.globalData.openId = result.data.openId;
					app.globalData.memberId = result.data.memberId;
					app.globalData.mobilePhone = result.data.mobilePhone;
					await this.getProduct();
					await this.getOrderInfo();
				} else {
					wx.setStorageSync('login_info', JSON.stringify(result.data));
					util.go('/pages/login/login/login');
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '13'
		});
		console.log(result);
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				orderInfo: result.data.base
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		const item = this.data.listOfPackages[this.data.choiceIndex];
		if (item.etcCardId === 1) {
			// serviceFeeType  是否收取权益服务费：0否，1是
			// productType: 套餐类型 1-业务员套餐 2-小程序套餐  3-H5套餐  4-后台办理套餐，5-APi办理  6-空发套餐
			// deliveryType: 1-邮寄 2-线下取货 3-现场办理
			const timeComparison = util.timeComparison('2023/8/23', this.data.orderInfo.base.addTime);
			// timeComparison 1-新订单 2-老订单
			if (item.deliveryType === 1 && (item.productType === 2 || item.productType === 3 || item.productType === 6)) {
				return util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=${timeComparison === 1 ? 'QTnotFeesNew' : 'QTnotFees'}`);	// 不含注消费
			}
			if (item.deliveryType === 3 && (item.productType === 1 || item.productType === 5 || item.productType === 6)) {
				return util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=${timeComparison === 1 ? 'QTNew' : 'QT'}`);
			}
		}
		if (item.etcCardId === 2) {
			if (item.deliveryType === 1 && (item.productType === 2 || item.productType === 3 || item.productType === 6)) {
				return util.go('/pages/agreement_documents/equity_agreement/equity_agreement?type=MTnotFees');	// 不含注消费
			}
			if (item.deliveryType === 3 && (item.productType === 1 || item.productType === 5 || item.productType === 6)) {
				return util.go('/pages/agreement_documents/equity_agreement/equity_agreement?type=MT');
			}
		}
		// 1-自购设备 2-免费设备 3-自购(其他)
		if (item?.environmentAttribute === 2) {
			util.go(`/pages/agreement_documents/agreement/agreement`);
		} else {
			util.go(`/pages/agreement_documents/new_self_buy_equipmemnt_agreement/index`);
		}
		// if (item.pledgeType === 4) {
		// 	// ETC押金办理模式 协议
		// 	return util.go('/pages/agreement_documents/margin_user_handling_agreement/margin_user_handling_agreement');
		// }
		// // 1-自购设备 2-免费设备 3-自购(其他)
		// if (item?.environmentAttribute === 2) {
		// 	if (item.etcCardId === 1) {
		// 		util.go(`/pages/agreement_documents/free_equipment_agreement/free_equipment_agreement`);
		// 	} else {
		// 		util.go(`/pages/agreement_documents/agreement/agreement`);
		// 	}
		// } else {
		// 	if (item.isSignTtCoupon === 1) {
		// 		util.go(`/pages/agreement_documents/self_buy_equipmemnt_agreement/self_buy_equipmemnt_agreement`);
		// 	} else {
		// 		util.go(`/pages/agreement_documents/new_self_buy_equipmemnt_agreement/index`);
		// 	}
		// }
	},
	// ETC 服务协议
	onClickGoNMAgreement () {
		return util.go('/pages/agreement_documents/equity_agreement/equity_agreement?type=nm');
	},
	// 黔通用户协议
	onClickGoQianTongAgreement () {
		util.go('/pages/truck_handling/agreement_for_qiantong_to_charge/agreement');
	},
	// 通通券协议
	onClickGoTTQAgreement1 () {
		util.go('/pages/agreement_documents/coupon_agreement/coupon_agreement');
	},
	// 查看隐私协议
	onClickGoPrivacyHandle () {
		util.go('/pages/agreement_documents/privacy_agreement/privacy_agreement');
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

	// ------------------------------------------------------------------------------------------------------------------
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
	// 获取权益包信息
	async getNodeHeight (num) {
		this.setData({
			isLoaded: false
		});
		util.showLoading({
			title: '加载中'
		});
		let equityListMap = {
			defaultEquityList: [],	// 默认权益包列表
			addEquityList: [],	// 加购权益包列表
			serviceEquityList: []	// 综合权益包
		};
		let currentIndex = 0;
		for (currentIndex; currentIndex < num; currentIndex++) {
			// 加购权益包
			const packageIds = this.data.listOfPackages[currentIndex].rightsPackageIds && this.data.listOfPackages[currentIndex]?.rightsPackageIds.length !== 0;
			if (!packageIds) {
				equityListMap.addEquityList.push({index: currentIndex, packageName: '',payMoney: 0,aepIndex: -1});
			} else {
				const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
					packageIds: this.data.listOfPackages[currentIndex]?.rightsPackageIds
				},'POST',false);
				if (result.code === 0) {
					// this.data.listOfPackages[currentIndex].mustChoiceRightsPackage === 1 ? 0 : -1
					let packageName = '';
					result.data.map((item,index) => {
						packageName += item.packageName;
						packageName += index < result.data.length - 1 ? '+' : '';
					});
					equityListMap.addEquityList.push({index: currentIndex,packageName: packageName,subData: result.data,aepIndex: -1});
				} else {
					// 占位
					equityListMap.addEquityList.push({index: currentIndex, packageName: '',payMoney: 0,aepIndex: -1});
				}
			}
			// 默认权益包(只能有一个) + 2%综合服务费赠送的权益包
			let defaultPackages = [];
			let sevicePackages = this.data.listOfPackages[currentIndex].serviceFeePackageId;
			if (sevicePackages) defaultPackages = sevicePackages.split(',');
			if (defaultPackages.length === 0) {
				equityListMap.serviceEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
			} else {
				const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
					packageIds: defaultPackages
				},'POST',false);
				if (result.code === 0) {
					let packageName = '';
					// let payMoney = 0;	// 综合服务权益包 金额
					result.data.map((item,index) => {
						packageName += item.packageName;
						// payMoney += item.payMoney;
						packageName += index < result.data.length - 1 ? '+' : '';
					});
					equityListMap.serviceEquityList.push({index: currentIndex,subData: result.data,packageName: packageName,payMoney: 0});
				} else {
					// 占位
					equityListMap.serviceEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
				}
			}
			let packageId = this.data.listOfPackages[currentIndex].rightsPackageId && this.data.listOfPackages[currentIndex].rightsPackageId !== 0;
			if (!packageId) {
				equityListMap.defaultEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
			} else {
				const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
					packageIds: new Array(this.data.listOfPackages[currentIndex].rightsPackageId)
				},'POST',false);
				if (result.code === 0) {
					equityListMap.defaultEquityList.push({index: currentIndex,subData: result.data});
				} else {
					// 占位
					equityListMap.defaultEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
				}
			}
		}
		this.setData({
			isLoaded: true,
			equityListMap: equityListMap
		});
		this.getHeight(num);
	},
	// 获取节点的高度
	getHeight (num) {
		let that = this;
		let nodeHeightList = [];
		let currentIndex = 0;
		for (currentIndex; currentIndex < num; currentIndex++) {
			let allIndex = 'module' + currentIndex;
			wx.createSelectorQuery().select(`.${allIndex}`).boundingClientRect(function (rect) {
				nodeHeightList.push(rect.top);
				that.setData({
					nodeHeightList
				});
			}).exec();
		}
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
	},
	// 弹窗详情
	popDetail (e) {
		let type = e.currentTarget.dataset.type;	// string
		let index = e.currentTarget.dataset.index;	// number
		let def = this.data.equityListMap.defaultEquityList[index];
		let service = this.data.equityListMap.serviceEquityList[index];
		switch (type) {
			case '1':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'new_device',
						title: '第五代设备',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade
					}
				});
				break;
			case '2':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'default_equity_package',
						title: '加赠权益包',
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade,
						equityPackageInfo: service.subData && service.subData.length > 0 ? service.subData.concat(def.subData) : def.subData
					}
				});
				break;
			case '3':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'give_equity_package',
						title: '权益商城',
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade
					}
				});
				break;
			case '4':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: this.data.listOfPackages[index].shopProductId === this.data.roadRescueShopProductId ? 'road_rescue1' : 'sign_tt_coupon',
						title: '通通券',
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade
					}
				});
				break;
			case '5':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'add_equity_package',
						title: '加购权益包',
						isSplit: true,
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 40%,#FFFFFF 100%)',
						equityPackageInfo: this.data.equityListMap.addEquityList[index].subData,
						mustEquity: this.data.listOfPackages[index].mustChoiceRightsPackage,
						aepIndex: this.data.equityListMap.addEquityList[this.data.activeIndex].aepIndex
					}
				});
				break;
			case '6':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'road_rescue',
						title: '下单送500元道路救援服务',
						isSplit: true,
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 40%,#FFFFFF 100%)'
					}
				});
				break;
			default:
				break;
		}
	},
	// 弹窗组件
	cDPopup (e) {
		let choiceIndex = parseInt(e.detail.choiceIndex);
		let equityListMap = this.data.equityListMap;
		equityListMap.addEquityList[this.data.activeIndex].aepIndex = choiceIndex;
		this.setData({equityListMap});
	},

	// 根据套餐id获取套餐信息
	async getProduct () {
		const result = await util.getDataFromServersV2('consumer/system/get-product-by-id', {
			shopProductId: app.globalData.salesmanEmptyObj.shopProductId || this.data.shopProductId
		});
		if (!result) return;
		if (result.code === 0) {
			try {
				result.data.descriptionList = JSON.parse(result.data.description);
			} catch (e) {
			}
			let datas = new Array(result.data);
			datas.map(item => {
				item.rightsPackageIds = item.packageIds && item.packageIds.length > 0 ? item.packageIds.split(',') : [];
			});
			this.setData({
				listOfPackages: datas
			});
			if (this.data.citicBankshopProductIds.includes(result.data.shopProductId)) {
				this.setData({
					citicBank: true
				});
			}
			this.getNodeHeight(this.data.listOfPackages.length);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 下一步
	async next () {
		if (this.data.choiceIndex === -1) return;
		if (!this.data.getAgreement) {
			util.showToastNoIcon('请同意并勾选协议！');
			return;
		}
		if (this.data.listOfPackages[this.data.choiceIndex].mustChoiceRightsPackage === 1 && this.data.equityListMap.addEquityList[this.data.choiceIndex].aepIndex === -1) {
			util.showToastNoIcon('请选择一个权益包');
			return;
		}
		// // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理，如果有则弹窗提示，并且不执行后面流程
		if (this.data.listOfPackages[this.data.choiceIndex].pledgeType === 4 && this.data.shopProductId) {
			if (await this.handlEquityLimit()) {
				return;
			}
		}
		// 中信银行 白金卡
		if (this.data.listOfPackages[this.data.choiceIndex].shopProductId === app.globalData.cictBankObj.citicBankShopshopProductId || this.data.listOfPackages[this.data.choiceIndex].shopProductId === app.globalData.cictBankObj.cictBankNmPlatinumCard) {
			this.selectComponent('#popTipComp').show({
				type: 'five',
				title: '活动细则',
				btnCancel: '我再想想',
				btnconfirm: '我知道了'
			});
			return;
		}
		// 如果已有订单直接拉起支付
		if (this.data.shopProductId) {
			if (this.data.listOfPackages[this.data.choiceIndex]?.pledgePrice ||
				this.data.equityListMap[this.data.activeIndex]?.payMoney) {
				await this.marginPayment(this.data.listOfPackages[this.data.choiceIndex].pledgeType);
				return;
			}
		}
		// 判断是否从业务员端过来得空发套餐，是：执行保存订单
		if (this.data.listOfPackages[this.data.choiceIndex].shopProductId === app.globalData.salesmanEmptyObj.shopProductId) {
			if (app.globalData.userInfo.needBindingPhone !== 1) {
				this.emptySaveOrder();
			} else {
				this.login();
			}
        }
	},
	// 提交订单
	async emptySaveOrder () {
		let that = this;
		if (!that.data.isLoaded) {
			util.showToastNoIcon('数据加载中,请稍后重试');
			return;
		}
		if (that.data.isRequest) {
			return;
		} else {
			that.setData({isRequest: true});
		}
		wx.uma.trackEvent('package_the_rights_and_interests_next');
		that.setData({isRequest: false});
		let addEquity = this.data.equityListMap.addEquityList[this.data.choiceIndex];	// 加购权益包
		let params = {
			emptyIssue: true,	// 标识 业务员空发
			mobilePhone: app.globalData.mobilePhone,	// 手机号码
			// shopId: this.data.listOfPackages[this.data.choiceIndex].shopId, // 商户id
			shopId: app.globalData.salesmanEmptyObj.emptyShopId,	// 业务员的商户ID
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,	// 套餐ID
			rightsPackageId: addEquity.aepIndex !== -1 ? addEquity.subData[addEquity.aepIndex].id : '',	// 权益包ID
			areaCode: '0',	// 区域编码
			shopUserId: app.globalData.salesmanEmptyObj.shopUserId,	// 业务员用户ID
			promoterId: app.globalData.salesmanEmptyObj.promoterId,	// 业务员推广ID
			promoterType: 41, // 业务员推广类型（固定）
			orderType: 71,	// 订单类型（空发）
			orderId: this.data.orderId
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		that.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			this.setData({orderId: result.data.orderId});
			app.globalData.orderInfo['orderId'] = result.data.orderId;
			// 添加协议记录
			const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
				orderId: result.data.orderId // 订单id
			});
			if (!res) return;
			// // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理（ > 5个），如果有则弹窗提示，并且不执行后面流程
			if (this.data.listOfPackages[this.data.choiceIndex].pledgeType === 4) {
				if (await this.handlEquityLimit()) {
					return;
				}
			}
			if (that.data.listOfPackages[that.data.choiceIndex]?.pledgePrice || addEquity.aepIndex !== -1) {
				await that.marginPayment(that.data.listOfPackages[that.data.choiceIndex].pledgeType);
			} else {
				wx.switchTab({
					url: '/pages/Home/Home'
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 支付
	async marginPayment (pledgeType) {
		if (this.data.isRequest) return;
		this.setData({isRequest: true});
		util.showLoading();
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
                        util.go(`/pages/empty_hair/empty_qrcode/empty_qrcode`);
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
	// 办理权益套餐的限制
	async handlEquityLimit () {
		const result = await util.getDataFromServersV2('consumer/order/precharge/list',{
			orderId: app.globalData.orderInfo.orderId // 订单id
		});
		if (!result) return;
		if (result.code === 0) {
			if (result.data.length >= 5) {
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
				return true;
			} else {
				return false;
			}
		} else {
			util.showToastNoIcon(result.message);
			return true;
		}
	}
});
