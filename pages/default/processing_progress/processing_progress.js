import {
	jumpCouponMini
} from '../../../utils/utils';

/**
 * @author 狂奔的蜗牛
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		bankList: [],
		isRequest: false,
		orderId: undefined,
		dashedHeight: 0,
		accountVerification: 0, //  0 没有核验id   1：核验成功，2-正在核验
		info: undefined,
		isContinentInsurance: false, // 是否是大地保险
		number: 0,
		showDetailWrapper: false,
		showDetailMask: false,
		memberId: '',
		rechargeId: '', // 预充保证金id
		requestNum: 0, // 请求次数
		weiBaoOrderId: '',
		isSalesmanPrecharge: false,
		showCouponWrapper: false,
		showCouponMask: false,
		prechargeInfo: '', // 预充流程,预充信息
		disclaimerDesc: app.globalData.disclaimerDesc,
		citicBankshopProductIds: app.globalData.cictBankObj.citicBankshopProductIds, // 信用卡套餐集合
		cictBail: false, // 中信保证金
		isWellBank: false, // 平安信用卡
		isGuangFaBank: false,	// 广发信用卡
		isQingHaiHighSpeed: false, // 是否是青海办理进入
		firstCar: app.globalData.pingAnBindGuests // 平安获客
	},
	async onLoad (options) {
		this.setData({
			isContinentInsurance: app.globalData.isContinentInsurance || app.globalData.isPingAn,
			isQingHaiHighSpeed: app.globalData.isQingHaiHighSpeed
		});
		if (options.source && options.source === 'henanMobile') {
			wx.hideHomeButton();
		}
		if (options.orderId) {
			this.setData({
				orderId: options.orderId
			});
		} else {
			this.setData({
				orderId: app.globalData.orderInfo.orderId
			});
		}
		if (options.type) {
			this.setData({
				type: options.type
			});
		}
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			if (!this.data.firstCar) {
				this.setData({
					firstCar: await util.getBindGuests()
				});
			}
			this.getProcessingProgress();
			await this.getQueryProcessInfo();
			// 查询是否欠款
			await util.getIsArrearage();
		}
	},
	onShow () {
		if (this.data.cictBail) this.getProcessingProgress();
	},
	initCouponMask () {
		let time = new Date().toLocaleDateString();
		let that = this;
		// 首先获取是否执行过
		wx.getStorage({
			key: 'coupon-today',
			success: function (res) {
				// 成功的话 说明之前执行过，再判断时间是否是当天
				if (res.data && res.data !== time) {
					wx.setStorageSync('coupon-today', new Date().toLocaleDateString());
					that.setData({
						showCouponWrapper: true,
						showCouponMask: true
					});
				}
			},
			fail: function (res) {
				// 没有执行过的话 先存一下当前的执行时间
				that.setData({
					showCouponWrapper: true,
					showCouponMask: true
				});
				wx.setStorageSync('coupon-today', new Date().toLocaleDateString());
			}
		});
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: (res) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('登录失败！');
				}, async (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						app.globalData.userInfo = res.data;
						app.globalData.openId = res.data.openId;
						app.globalData.memberId = res.data.memberId;
						app.globalData.mobilePhone = res.data.mobilePhone;
						if (!this.data.firstCar) {
							this.setData({
								firstCar: await util.getBindGuests()
							});
						}
						await this.getProcessingProgress();
						await this.getQueryProcessInfo();
						// 查询是否欠款
						await util.getIsArrearage();
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 选择预充方式
	onClickPrechargeWay (e) {
		const type = +e.currentTarget.dataset.type;
		if (type === 1) util.go(`/pages/account_management/pay_method/pay_method?orderId=${this.data.orderId}`);
		if (type === 2) this.selectComponent('#rechargePrompt').show();
	},
	// 获取预充结果
	async onClickRechargeResult () {
		this.setData({
			requestNum: 0
		});
		await this.applyQuery(this.data.rechargeId);
	},
	// 充值查询
	async applyQuery (rechargeId) {
		if (!rechargeId) {
			util.showToastNoIcon('rechargeId丢失');
			return;
		}
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/applyQuery', {
			rechargeId: rechargeId
		});
		if (!result) return;
		if (result.code === 1) {
			// 充值中
			util.showLoading('正在充值...');
			this.data.requestNum++;
			this.setData({
				requestNum: this.data.requestNum
			});
			if (this.data.requestNum === 5) {
				return;
			}
			setTimeout(async () => {
				await this.applyQuery(rechargeId);
			}, 2000);
			return;
		}
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		util.showToastNoIcon('充值成功');
		await this.orderHold();
	},
	// 保证金冻结
	async orderHold () {
		util.showLoading('冻结中...');
		const result = await util.getDataFromServersV2('consumer/order/orderHold', {
			bankAccountId: app.globalData.bankCardInfo?.bankAccountId,
			orderId: this.data.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.getProcessingProgress();
		} else {
			util.showToastNoIcon(result.message);
			// 冻结失败-预充成功,更新账户金额
			await util.getV2BankId();
		}
	},
	// 预充保证金
	async onClickPrecharge () {
		if (!app.globalData.bankCardInfo?.bankAccountId) await util.getV2BankId();
		if (this.data.info.holdBalance <= app.globalData.bankCardInfo?.balanceAmount) {
			await this.orderHold();
			return;
		}
		const result = await util.getDataFromServersV2('consumer/order/orderDeposit', {
			bankAccountId: this.data.bankList[0].bankAccountId,
			orderId: this.data.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				rechargeId: result?.data?.rechargeId
			});
			await this.applyQuery(result?.data?.rechargeId);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 预充模式-查询预充信息
	async getQueryProcessInfo () {
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: this.data.orderId
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			result.data.source = 1;
			this.setData({
				prechargeInfo: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickCheckAccount () {
		util.go('/pages/account_management/index/index?needLoadEtc=true');
	},
	// 去微保
	goMicroInsurance () {
		wx.uma.trackEvent('processing_progress_weibao');
		const wtagid = '104.210.3';
		let params = {
			memberId: app.globalData.userInfo.memberId,
			salesmanId: 0,
			carNo: this.data.info.vehPlates,
			orderId: this.data.orderId
		};
		if (this.data.info.orderType === 31) {
			let date = new Date();
			let mouth = date.getMonth() + 1;
			let time = date.getFullYear() + '-' + util.formatNumber(mouth) + '-' + util.formatNumber(date.getDate());
			if (this.data.info.contractTime && time === this.data.info.contractTime.substring(0, 10)) {
				params['salesmanId'] = this.data.info.shopUserId;
			}
		}
		util.goMicroInsuranceVehicleOwner(params, wtagid);
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 关闭详情
	close () { },
	hide () {
		this.setData({
			showDetailWrapper: false,
			showCouponWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showCouponMask: false,
				showDetailMask: false
			});
		}, 400);
	},
	handleCouponMini () {
		this.selectComponent('#dialog1').show('allCoupon');
		// jumpCouponMini();
	},
	// 免责声明
	popUp () {
		let str = this.selectComponent('#dialog1').noShow();
		if (str === 'allCoupon') {
			jumpCouponMini();
		}
	},
	// 签约高速弹窗
	signingExpress () {
		this.selectComponent('#notSigningPrompt').show();
	},
	// 获取办理进度
	getProcessingProgress () {
		util.showLoading();
		let that = this;
		util.getDataFromServer('consumer/order/transact-schedule', {
			orderId: this.data.orderId
		}, () => {
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				if (res.data?.isSignTtCoupon === 1) {
					this.initCouponMask();
				}
				// 新流程-货车订单
				if (res.data.isNewTrucks === 1) {
					wx.uma.trackEvent('truck_for_processing_progress');
				}
				if (res.data.flowVersion === 4 && res.data.auditStatus === -1) res.data.auditStatus = 0;
				this.setData({
					isSalesmanPrecharge: res.data.orderType === 31 && res.data.flowVersion === 4,
					accountVerification: res.data.orderVerificationStatus,
					bankCardInfo: app.globalData.bankCardInfo,
					cictBail: (res.data.obuStatus === 1 || res.data.obuStatus === 5) && res.data.shopProductId !== app.globalData.cictBankObj.wellBankShopProductId && res.data.shopProductId !== app.globalData.cictBankObj.guangfaBank &&
						(
							this.data.citicBankshopProductIds.includes(res.data.shopProductId) ||
							(res.data.orderType === 31 && res.data.productName?.includes('中信') && res.data.pledgeType === 2)
						),
					isWellBank: (res.data.obuStatus === 1 || res.data.obuStatus === 5) && res.data.shopProductId === app.globalData.cictBankObj.wellBankShopProductId,
					isGuangFaBank: res.data.shopProductId === app.globalData.cictBankObj.guangfaBank,
					info: res.data
				});

				// 平安获客 礼品弹窗
				let isShowpAPop = wx.getStorageSync('isShowpAPop');
				if (!app.globalData.isQingHaiHighSpeed && !isShowpAPop) {
					if (this.data.firstCar.pingAnBindVehplates.includes(res.data.vehPlates) && (this.data.firstCar.vehKeys === '*' || (this.data.firstCar.vehKeys.includes(res.data.vehPlates.substring(0, 1)) && !this.data.firstCar.filterKeys.includes(res.data.vehPlates.substring(0, 2))))) {
						wx.setStorageSync('isShowpAPop', true);
						// this.selectComponent('#popTipComp').show({type: 'bingGuttes',title: '礼品领取',bgColor: 'rgba(42, 80, 68, 0.7)'});
						if (this.data.info?.vehPlates.includes('云')) {
							this.selectComponent('#popTipComp').show({
								type: 'newPop',
								title: '云',
								bgColor: 'rgba(0,0,0, 0.6)'
							});
						} else {
							this.selectComponent('#popTipComp').show({
								type: 'newPop',
								title: '全国',
								bgColor: 'rgba(0,0,0, 0.6)'
							});
						}
					}
				}

				if (res.data.autoAuditStatus === 0 && res.data.auditStatus === 0) {
					if (that.data.number >= 5) {
						util.hideLoading();
						return;
					}
					let number = that.data.number + 1;
					that.setData({
						number: number
					});
					setTimeout(() => {
						that.getProcessingProgress();
					}, 2000);
				} else {
					util.hideLoading();
				}
			} else {
				util.hideLoading();
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => { });
	},
	// 刷新1分钱核验
	refreshCheck () {
		util.showLoading();
		util.getDataFromServer('consumer/order/order-verification-status-refresh', {
			orderVerificationId: this.data.info.orderVerificationId
		}, () => { }, (res) => {
			if (res.code === 0) {
				this.setData({
					accountVerification: res.data.status,
					[`info.orderVerificationId`]: res.data.orderVerificationId
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 去设备详情 审核失败:不可办理
	goEtcDetails () {
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.orderId}`);
	},
	// 下一步
	next () {
		app.globalData.packagePageData = undefined;
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle () {
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=0');
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/customer_service/index/index`);
		// util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	// 复制快递单号
	copyLogisticsNo (e) {
		let logisticsNo = e.currentTarget.dataset['no'];
		wx.setClipboardData({
			data: logisticsNo,
			success (res) {
				wx.getClipboardData({
					success (res) {
						console.log(res.data); // data 剪贴板的内容
					}
				});
			}
		});
	},
	// 确认收货去激活
	async onClickCctivate () {
		if (this.data.info.orderType === 81) {
			const result = await util.getDataFromServersV2('consumer/order/query-contract', { // 查询车主服务签约
				orderId: this.data.orderId
			});
			if (!result) return;
			if (result.code === 0) {
				// contractStatus; // 签约状态   签约状态 -1 签约失败 0发起签约 1已签约 2解约
				if (result.data.contractStatus === 0 && result.data.version === 'v2') {
					this.selectComponent('#popTipComp').show({
						type: 'four',
						title: '重新签约',
						content: '检测到你已解除车主服务签约，将影响正常的高速通行',
						btnCancel: '取消',
						btnconfirm: '恢复签约',
						params: {
							orderInfo: app.globalData.myEtcList.filter(item => item.id === this.data.orderId)[0]
						}
					});
					return;
				}
			} else {
				util.showToastNoIcon(result.message);
			}
		}
		if (this.data.info.flowVersion === 8) {
			let obj = {
				orderId: app.globalData.orderInfo.orderId,
				mobile: this.data.info.cardMobilePhone
			};
			const data = await util.getSteps_9901(obj);
			if (data.stepNum === 4) {
				util.go(`/pages/default/obucarquer/obucarquer`);
				return;
			}
			return;
		}
		if (this.data.info.shopId && this.data.info.shopId === '624263265781809152') {
			// 津易行
			this.selectComponent('#notJinYiXingPrompt').show();
		} else {
			util.showLoading();
			util.getDataFromServer('consumer/order/affirm-take-obu', {
				logisticsId: this.data.info.logisticsId
			}, () => {
				util.hideLoading();
			}, (res) => {
				util.hideLoading();
				if (res.code === 0) {
					this.handleActivate(this.data.info);
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken);
		}
	},
	// 弹窗确认回调
	onHandle (e) {
		console.log(e.detail.orderInfo);
		if (e.detail.orderInfo) {
			// 恢复签约
			app.globalData.orderInfo.orderId = e.detail.orderInfo.id;
			wx.uma.trackEvent('index_for_dialog_signing');
			this.restoreSign(e.detail.orderInfo);
		}
	},
	// 恢复签约
	async restoreSign (obj) {
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: obj.id
		});
		console.log('3', result);
		if (!result) return;
		if (result.code === 0) {
			app.globalData.signAContract = 1;
			// 签约成功 userState: "NORMAL"
			if (result.data.contractStatus !== 1) {
				if (result.data.version === 'v3') {
					// 3.0
					if (result.data.contractId) {
						wx.navigateToMiniProgram({
							appId: 'wxbcad394b3d99dac9',
							path: 'pages/etc/index',
							extraData: {
								contract_id: result.data.contractId
							},
							success () { },
							fail () {
								// 未成功跳转到签约小程序
								util.showToastNoIcon('调起微信签约小程序失败, 请重试！');
							}
						});
					} else {
						await this.weChatSign(obj);
					}
				} else {
					await this.weChatSign(obj);
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 微信签约
	async weChatSign (obj) {
		let params = {
			orderId: obj.id, // 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据 立即签约 需标记资料已完善
			params['upgradeToTwo'] = true; // 1.0数据转2.0
			params['dataComplete'] = 1; // 资料已完善
		}
		if (obj.isNewTrucks === 1 && obj.status === 0) {
			params['dataComplete'] = 1; // 资料已完善
		}
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.isSignUpImmediately = true; // 返回时需要查询主库
			app.globalData.belongToPlatform = obj.platformId;
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.orderStatus = obj.selfStatus;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			app.globalData.signAContract === -1;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async handleActivate (obj) {
		app.globalData.orderInfo.orderId = this.data.orderId;
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: this.data.orderId
		});
		let res = await util.getDataFromServersV2('consumer/order/common/get-member-by-carno', {
			carNo: result.data.vehPlates,
			vehColor: result.data.vehColor
		});
		let qtLimit = '';
		if (obj.obuCardType === 4) {
			qtLimit = JSON.stringify(res.data.qtLimit);
		}
		wx.setStorageSync('baseInfo', {
			orderId: obj.id,
			mobilePhone: app.globalData.userInfo.mobilePhone,
			channel: obj.obuCardType,
			qtLimit: qtLimit, // 青通卡激活所需
			serverId: obj.shopId,
			carNoStr: obj.vehPlates,
			obuStatus: obj.obuStatus
		});
		switch (obj.obuCardType) {
			case 1: // 贵州 黔通卡
			case 21:
				util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=${obj.auditStatus}`);
				break;
			case 2: // 内蒙 蒙通卡
			case 23: // 河北交投
				if (!this.data.choiceEquipment) {
					this.setData({
						choiceEquipment: this.selectComponent('#choiceEquipment')
					});
				}
				this.data.choiceEquipment.switchDisplay(true);
				break;
			case 3: // 山东 鲁通卡
			case 9: // 山东 齐鲁通卡
				util.go(`/pages/empty_hair/instructions_ujds/index?auditStatus=${obj.auditStatus}`);
				break;
			case 4: // 青海 青通卡
			case 5: // 天津 速通卡
			case 10: // 湖南 湘通卡
				util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${obj.obuCardType}`);
				break;
			case 8: // 辽宁 辽通卡
				util.go(`/pages/empty_hair/instructions_lnnk/index?auditStatus=${obj.auditStatus}`);
				break;
		}
	},
	onClickTranslucentHandle () {
		this.data.choiceEquipment.switchDisplay(false);
	},
	// 复制银行卡号
	onClickCopyBankCardNumber (e) {
		let bankCardNumber = e.currentTarget.dataset['no'];
		wx.setClipboardData({
			data: bankCardNumber,
			success (res) {
				wx.getClipboardData({
					success (res) {
						console.log(res.data); // data 剪贴板的内容
					}
				});
			}
		});
	},
	goInstallationTutorial () {
		let channel = this.data.info?.obuCardType;
		if (channel === 1 && this.data.info?.flowVersion === 8) { // 黔通卡 9901套餐
			util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=${this.data.info.auditStatus}`);
			console.log('黔通卡 9901套餐');
			return;
		}
		switch (channel) {
			case 1: // 贵州 黔通卡
				util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=${this.data.info.auditStatus}`);
				break;
			case 8: // 辽宁 辽通卡
				util.go(`/pages/empty_hair/instructions_lnnk/index?auditStatus=${this.data.info.auditStatus}`);
				break;
			case 3: // 山东 鲁通卡
			case 9: // 山东 齐鲁通卡
				util.go(`/pages/empty_hair/instructions_ujds/index?auditStatus=${this.data.info.auditStatus}`);
				break;
			case 2: // 蒙通卡
				util.go(`/pages/empty_hair/neimeng_installation_tutorial/neimeng_installation_tutorial?auditStatus=${this.data.info.auditStatus}`);
				break;
			default: // 其他需要我们自己激活的省
				util.go(`/pages/empty_hair/instructions/index?auditStatus=${this.data.info.auditStatus}`);
		}
	},
	goHome () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	},
	// 退还说明
	async returnIllustrate () {
		let that = this;
		if (app.globalData.cictBankObj.minshenBank.includes(this.data.info.shopProductId)) {
			util.getDataFromServer('consumer/order/checkMsUserType', {
				orderId: that.data.orderId
			}, () => {
				util.hideLoading();
			}, (res) => {
				if (res.code === 0) {
					that.selectComponent('#popTipComp').show({
						type: 'returnEquityFunds',
						title: '退还说明',
						btnCancel: '我再想想',
						btnconfirm: '继续退还',
						shopProductId: that.data.info.shopProductId,
						citicBankshopProductIds: app.globalData.cictBankObj.citicBankshopProductIds,
						callBack: () => {
							that.bailReturn();
						}
					});
					util.hideLoading();
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken, () => { });
		} else {
			that.selectComponent('#popTipComp').show({
				type: 'returnEquityFunds',
				title: '退还说明',
				btnCancel: '我再想想',
				btnconfirm: '继续退还',
				shopProductId: that.data.info.shopProductId,
				citicBankshopProductIds: app.globalData.cictBankObj.citicBankshopProductIds,
				callBack: () => {
					that.bailReturn();
				}
			});
		}
	},

	// 保证金退回
	async bailReturn () {
		if (this.data.isRequest) return;
		this.setData({
			isRequest: true
		});
		const params = {
			tradeType: 1,
			packageId: app.globalData.cictBankObj.citicBankRightId, // 权益ID
			openId: app.globalData.userInfo.openId,
			orderId: this.data.orderId,
			creditCardTag: this.data.isWellBank ? 2 : app.globalData.cictBankObj.minshenBank.includes(this.data.info.shopProductId) ? 3 : 1 // 信用卡标识：1.中信信用卡，2.平安信用卡，3.民生信用卡
		};
		// 业务员端
		// if (this.data.shopUserInfo) {
		// 	params.shopUserId = this.data.salesmanInfo.shopUserId;
		// 	params.shopId = this.data.salesmanInfo.shopId;
		// 	if (this.data.salesmanInfo.orderId) params.orderId = this.data.salesmanInfo.orderId;
		// }

		const result = await util.getDataFromServersV2('consumer/voucher/rights/independent-rights-buy', params);
		if (!result) {
			this.setData({
				isRequest: false
			});
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
					this.setData({
						isRequest: false
					});
					if (res.errMsg === 'requestPayment:ok') {
						wx.showLoading({
							mask: true,
							title: '退款处理中...'
						});
						setTimeout(function () {
							this.getRefundStatus();
						}, 10000);
					} else {
						util.showToastNoIcon('支付失败');
					}
				},
				fail: (res) => {
					this.setData({
						isRequest: false
					});
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败');
					}
				}
			});
		} else {
			this.setData({
				isRequest: false
			});
			util.showToastNoIcon(result.message);
		}
	},
	// 查询 refundStatus 状态
	getRefundStatus () {
		util.getDataFromServer('consumer/order/zx/orderRefundStatus', {
			orderId: this.data.orderId
		}, () => {
			wx.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				if (res.data.refundStatus === 3) {
					util.go(`/pages/bank_card/citic_bank_pay_res/citic_bank_pay_res?cictBankPayStatus=${true}&shopProductId=${this.data.info.shopProductId}`);
				} else {
					util.go(`/pages/bank_card/citic_bank_pay_res/citic_bank_pay_res?cictBankPayStatus=${false}&shopProductId=${this.data.info.shopProductId}`);
				}
				wx.hideLoading();
			} else {
				wx.hideLoading();
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => { });
	},
	// 跳转平安绑客
	goPingAn () {
		// 授权提醒
		// this.selectComponent('#popTipComp').show({type: 'bingGuttes',title: '礼品领取',bgColor: 'rgba(42, 80, 68, 0.7)'});
		if (this.data.info?.vehPlates.includes('云')) {
			this.selectComponent('#popTipComp').show({
				type: 'newPop',
				title: '云',
				bgColor: 'rgba(0,0,0, 0.6)'
			});
		} else {
			this.selectComponent('#popTipComp').show({
				type: 'newPop',
				title: '全国',
				bgColor: 'rgba(0,0,0, 0.6)'
			});
		}
	},
	// 继续办理平安信用卡入口
	async goPinAnH5 () {
		let res = await util.getDataFromServersV2('/consumer/order/pingan/get-apply-credit-card-url', {
			orderId: this.data.orderId
		});
		if (!res) return;
		if (res.code === 0) {
			// 跳转 h5
			util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data)}`);
		} else {
			util.showToastNoIcon(res.message);
		}
	},
	// 跳转到领券中心-领取洗车券
	receiveVoucher () {
		util.go(`/pages/personal_center/coupon_redemption_centre/coupon_redemption_centre`);
	},
	onUnload () {
		if (app.globalData.isQingHaiHighSpeedOnlineProcessing) {
			wx.navigateBackMiniProgram({
				extraData: {},
				success (res) { // 返回成功
				}
			});
			return;
		}
		if (this.data.type === 'main_process' || app.globalData.isNeedReturnHome) {
			wx.switchTab({
				url: '/pages/Home/Home'
			});
		}
	}

});
