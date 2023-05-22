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
        isOnloadData: true
    },
    async onLoad (options) {
		this.setData({
			shopProductId: options.shopProductId
		});
        if (app.globalData.userInfo.accessToken) {
            // 根据套餐id查询套餐信息
            await this.getProduct();
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
	},
	// ETC 服务协议
	onClickGoNMAgreement () {
		return util.go('/pages/default/equity_agreement/equity_agreement?type=nm');
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
	// 获取节点的高度
	async getNodeHeight (num) {
		this.setData({
			isLoaded: false
		});
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
				that.setData({
					nodeHeightList
				});
			}).exec();
			const packageIds = this.data.listOfPackages[index].rightsPackageIds && this.data.listOfPackages[index].rightsPackageIds.length > 1 ? new Array(this.data.listOfPackages[index].rightsPackageIds[0]) : this.data.listOfPackages[index].rightsPackageIds;
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
			isLoaded: true,
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
			this.setData({
				listOfPackages: new Array(result.data)
			});
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
		// // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理，如果有则弹窗提示，并且不执行后面流程
		if (this.data.listOfPackages[this.data.choiceIndex].pledgeType === 4 && this.data.shopProductId) {
			if (await this.handlEquityLimit()) {
				return;
			}
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
		let params = {
			emptyIssue: true,	// 标识 业务员空发
			mobilePhone: app.globalData.mobilePhone,	// 手机号码
			shopId: this.data.listOfPackages[this.data.choiceIndex].shopId, // 商户id
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,	// 套餐ID
			rightsPackageId: this.data.listOfPackages[this.data.choiceIndex].rightsPackageIds ? this.data.listOfPackages[this.data.choiceIndex].rightsPackageIds[0] || '' : '',	// 权益包ID
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
			if (that.data.listOfPackages[that.data.choiceIndex]?.pledgePrice ||
				that.data.equityListMap[that.data.activeIndex]?.payMoney) {
				await that.marginPayment(that.data.listOfPackages[that.data.choiceIndex].pledgeType);
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
