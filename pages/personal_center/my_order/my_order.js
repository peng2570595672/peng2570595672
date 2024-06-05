const util = require('../../../utils/util.js');
const app = getApp();
// deductStatus 扣款状态 0-待扣款  1-正常扣费 2-扣款失败 3-争议流水 4-重复流水 5-黑名单入库状态错误 // 6-退款中 7-已退款 9-补扣中 10-补缴中 11-补缴成功 12-补扣成功 13-纯优惠券扣款
// 月账单推送格式: pages/personal_center/my_order/my_order?isMsg=1&vehPlate=贵Z43260&month=2020-03
Page({
	data: {
		year: '',
		dropDownMenuTitle: ['', ''],
		timeList: [],
		totalPages: '',// 总页数
		page: 1,// 当前页
		pageSize: 20,// 每页多少条数据
		childModel: [
			{ id: '1-1', title: '1' },
			{ id: '1-2', title: '2' },
			{ id: '1-3', title: '3' },
			{ id: '1-4', title: '4' },
			{ id: '1-5', title: '5' },
			{ id: '1-6', title: '6' },
			{ id: '1-7', title: '7' },
			{ id: '1-8', title: '8' },
			{ id: '1-9', title: '9' },
			{ id: '1-10', title: '10' },
			{ id: '1-11', title: '11' },
			{ id: '1-12', title: '12' }
		],
		list: [],
		orderList: [],
		failBillMessage: '',
		successBillMessage: '',
		isGoOwnerService: true,
		successBillList: [],
		ownerServiceArrearsList: [],// 车主服务欠费
		allMoney: 0, // 总额
		vehicleList: [],// 全部车辆
		chooseTime: '',
		initializationDate: undefined,// 初始化日期,月账单推送进入
		initializationVehPlates: undefined,// 初始化车牌,月账单推送进入
		chooseVehPlates: '全部车辆',
		passengerCarList: [], // 客车
		truckList: []// 货车
	},
	onLoad (options) {
		let date = new Date();
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const time = year - 2018;
		for (let i = 0; i <= time; i = i + 1) {
			for (let k = 0; k < this.data.childModel.length; k = k + 1) {
				this.data.childModel[k].id = `${i}-${k + 1}`;
				const obj = {};
				obj.id = this.data.childModel[k].id;
				obj.title = this.data.childModel[k].title;
				const h = time - i;
				this.data.list.push(obj);
				this.setData({
					list: this.data.list,
					[`timeList[${time - i}].childModel`]: this.data.list
				});
			}
			this.setData({
				list: [],
				[`timeList[${time - i}].title`]: `${year - i}年`,
				[`timeList[${time - i}].id`]: `${i}`
			});
		}
		if (options.isMsg && (options.isMsg === 1 || options.isMsg === '1')) {
			// 月账单推送进入
			let dateArr = options.month.split('-');
			this.setData({
				[`dropDownMenuTitle[0]`]: options.vehPlate,
				[`dropDownMenuTitle[1]`]: `${dateArr[0]}年${util.formatNumber(dateArr[1])}月`,
				year: `${year}`,
				chooseTime: `${dateArr[0]}${util.formatNumber(dateArr[1])}`,
				initializationVehPlates: options.vehPlate,
				chooseVehPlates: options.vehPlate,
				initializationDate: `${dateArr[0]}${util.formatNumber(dateArr[1])}`
			});
		} else {
			this.setData({
				[`dropDownMenuTitle[0]`]: this.data.vehicleList[0],
				[`dropDownMenuTitle[1]`]: `${year}年${month}月`,
				year: `${year}`,
				chooseTime: `${year}${util.formatNumber(month)}`
			});
		}
	},
	onShow () {
		this.setData({
			successBillList: [],
			ownerServiceArrearsList: app.globalData.ownerServiceArrearsList
		});
		if (app.globalData.userInfo.accessToken) {
			if (JSON.stringify(app.globalData.myEtcList) === '{}') {
				this.getStatus();
			} else {
				if (!this.data.isGoOwnerService) {
					this.getStatus();
				} else {
					this.getMyETCList();
				}
			}
		} else {
			// 公众号进入需要登录
			this.login();
		}
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
				}, (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						// 已经绑定了手机号
						if (res.data.needBindingPhone !== 1) {
							app.globalData.userInfo = res.data;
							app.globalData.openId = res.data.openId;
							app.globalData.memberId = res.data.memberId;
							app.globalData.mobilePhone = res.data.mobilePhone;
							this.getStatus();
						} else {
							wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
							util.go('/pages/login/login/login');
							util.hideLoading();
						}
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
	// 获取订单信息
	getStatus () {
		util.showLoading();
		let params = {
			openId: app.globalData.openId
		};
		util.getDataFromServer('consumer/order/my-etc-list', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				app.globalData.ownerServiceArrearsList = res.data.filter(item => item.paySkipParams !== undefined); // 筛选车主服务欠费
				this.setData({
					ownerServiceArrearsList: app.globalData.ownerServiceArrearsList
				});
				app.globalData.myEtcList = res.data;
				this.getMyETCList();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 加载ETC列表
	async getMyETCList () {
		// 过滤未激活订单
		let obuStatusList;
		// obuStatusList = res.data.filter(item => item.obuStatus === 1); // 正式数据
		obuStatusList = app.globalData.myEtcList.filter(item => item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5); // 1 已激活  2 恢复订单  5 预激活
		if (obuStatusList.length > 0) {
			// 需要过滤未激活的套餐
			this.setData({
				orderList: obuStatusList
			});
			const truckList = obuStatusList.filter(item => item.isNewTrucks === 1);
			const passengerCarList = obuStatusList.filter(item => item.isNewTrucks === 0);
			truckList.map((item) => {
				this.data.truckList.push(item.vehPlates);
				this.data.truckList = [...new Set(this.data.truckList)];
				this.setData({
					truckList: this.data.truckList
				});
			});
			passengerCarList.map((item) => {
				this.data.passengerCarList.push(item.vehPlates);
				this.data.passengerCarList = [...new Set(this.data.passengerCarList)];
				this.setData({
					passengerCarList: this.data.passengerCarList
				});
			});
			if (this.data.chooseVehPlates !== '全部车辆') {
				if (this.data.initializationVehPlates && this.data.initializationDate) {
					// 月账单 推送进入
					obuStatusList.map((item) => {
						this.data.vehicleList.push(item.vehPlates);
						this.setData({
							vehicleList: this.data.vehicleList
						});
					});
				}
				this.getSuccessBill(this.data.chooseVehPlates, this.data.chooseTime);
			} else {
				obuStatusList.map((item) => {
					this.data.vehicleList.push(item.vehPlates);
					this.setData({
						vehicleList: this.data.vehicleList
					});
					this.getSuccessBill(item.vehPlates,this.data.chooseTime);
				});
			}
			this.setData({
				vehicleList: [...new Set(this.data.vehicleList)]
			});
			this.getMessage('全部车辆',this.data.chooseTime);
		} else {
			// 没有激活车辆
		}
	},
	// 获取失败/成功账单信息
	getMessage (vehPlates,time) {
		let channel = [];
		if (vehPlates === '全部车辆') {
			let flowVersion = this.data.orderList.filter(item => item.flowVersion !== 2); // 过滤总对总账单
			flowVersion.map((item) => {
				channel.push(item.obuCardType);
			});
			// 数组去重
			let hash = [];
			channel = channel.reduce((item1, item2) => {
				hash[item2] ? '' : hash[item2] = true && item1.push(item2);
				return item1;
			}, []);
		} else {
			let vehPlatesMsg;
			vehPlatesMsg = this.data.orderList.find((item) => {
				return item.vehPlates === vehPlates;
			});
			channel.push(vehPlatesMsg.obuCardType);
		}
		this.getFailBillMessage(channel,time);
	},
	// 查询欠费信息
	getFailBillMessage (channel) {
		let params = {
			channels: channel
		};
		util.getDataFromServer('consumer/etc/judge-detail-channels', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					failBillMessage: res.data
				});
				if (res.data.totalAmout) util.alertPayment(res.data.totalAmout);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 成功账单列表---new 查询所有的账单
	getSuccessBill (vehPlates,month) {
		util.showLoading();
		let channel;
		channel = this.data.orderList.filter(item => item.vehPlates === vehPlates);
		let url;
		let type = '';
		if (channel[0].flowVersion !== 1 && channel[0].flowVersion !== 5) {
			url = 'consumer/etc/hw-details';
			const typeObj = {
				1: 2,
				2: 1,
				3: 3,
				4: 4
			};
			// flowVersion 流程版本，1-分对分，2-新版（总对总）,3-选装 4-预充值 5-保证金模式 6-圈存 7-交行二类户
			// type 1总对总 2直连(分对分) 3选装 4预充值
			type = typeObj[`${channel[0].flowVersion}`] || 2;
		} else {
			url = 'consumer/etc/get-bill';
		}
		let params = {
			orderId: channel[0].id,
			type: type,
			vehPlate: vehPlates,
			month: month,
			channel: channel[0].obuCardType
		};
		util.getDataFromServer(url, params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				let data = channel[0].flowVersion !== 1 && channel[0].flowVersion !== 5 ? res.data.passRecords : res.data;
				data.map((item) => {
					item.channel = channel[0].obuCardType;
					if (channel[0].flowVersion !== 1 && channel[0].flowVersion !== 5) {
						item.flowVersion = channel[0].flowVersion;
					} else {
						item.flowVersion = channel[0].flowVersion;
						item.productName = channel[0].productName;
						item.passId = item.id;
					}
				});
				this.setData({
					successBillList: [...data, ...this.data.successBillList]
				});
				// 数组去重
				let hash = [];
				this.data.successBillList = this.data.successBillList.reduce((item1, item2) => {
					hash[item2['passId']] ? '' : hash[item2['passId']] = true && item1.push(item2);
					return item1;
				}, []);
				this.setData({
					successBillList: this.data.successBillList
				});

				let allMoney = 0;
				this.data.successBillList.map((item) => {
					allMoney += item.totalMmout + item.serviceMoney + (item.poundageFlag ? item.poundage || 0 : 0) + (item.passServiceMoney || 0) - (item.wxDiscountAmount || 0) - (item.discountMount || 0) - (item.refundMoney || 0);
				});
				this.setData({
					allMoney: allMoney
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 查看失败账单列表
	goArrearsBill () {
		util.go('/pages/personal_center/arrears_bill/arrears_bill');
	},
	// 账单详情
	async goDetails (e) {
		app.globalData.billingDetails = undefined;
		let model = e.currentTarget.dataset.model;
		let index = e.currentTarget.dataset.index;
		app.globalData.billingDetails = model;
		// @cyl   条件：1. 订单为黔通卡类型(1); 2. 订单为新增; 3. 订单为所有的客车类型
		let test = (new Array(model)).findIndex(item => ((item.etcCardId === 1 && util.timeComparison(item.addTime,'2022-11-11 00:00:00') === 1) || (item.carType === 1 || item.carType === 2 || item.carType === 3 || item.carType === 4)));
		if (parseInt(index) === 2) {
			// 通行手续费
			util.go(`/pages/personal_center/passing_charges_details/passing_charges_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
			return;
		}
		if (parseInt(model.splitState) === 1) {
			const result = await util.getDataFromServersV2('consumer/etc/get-split-bills-count', {
				detailId: model.id
			});
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			util.alert({
				title: `提醒`,
				content: `因账单金额过高导致扣款失败，为避免影响您的通行，系统已自动拆分为${result.data.ct}条扣款记录`,
				showCancel: true,
				cancelText: '跳过',
				confirmText: '去查看',
				confirm: () => {
					app.globalData.splitDetails = model;
					util.go('/pages/personal_center/split_bill/split_bill');
				},
				cancel: () => {
					util.go(`/pages/personal_center/order_details/order_details?id=${model.id || model.passId}&channel=${model.channel}&month=${model.month || this.data.chooseTime}`);
				}
			});
			return;
		}
		util.go(`/pages/personal_center/order_details/order_details?id=${model.id || model.passId}&channel=${model.channel}&month=${model.month || this.data.chooseTime}`);
	},
	// 下拉选择
	selectedItem (e) {
		let vehicleList = [];
		const vehicle = e.detail.selectedId ? this.data.chooseVehPlates : e.detail.selectedTitle;
		if (vehicle === '全部车辆') {
			vehicleList = this.data.vehicleList;
		} else if (vehicle === '客车') {
			vehicleList = this.data.passengerCarList;
		} else {
			vehicleList = this.data.truckList;
		}
		if (!e.detail.selectedId) {
			this.setData({
				initializationVehPlates: undefined
			});
			const vehicleType = ['全部车辆', '客车', '货车'];
			if (vehicleType.includes(e.detail.selectedTitle)) { // 统计点击全部车辆
				this.setData({
					chooseVehPlates: e.detail.selectedTitle
				});
				vehicleList.map((item) => {
					if (item !== '全部车辆') {
						this.getSuccessBill(item,this.data.chooseTime);
					}
				});
			} else {
				this.setData({
					successBillList: [],
					chooseVehPlates: e.detail.selectedTitle
				});
				this.getSuccessBill(e.detail.selectedTitle,this.data.chooseTime);
			}
		} else {
			this.setData({
				initializationDate: undefined
			});
			const month = e.detail.selectedId.match(/-(\S*)/)[1];
			const id = e.detail.selectedId.match(/(\S*)-/)[1];
			this.setData({
				chooseTime: `${this.data.year - id}${util.formatNumber(month)}`,
				successBillList: []
			});
			const vehicleType = ['全部车辆', '客车', '货车'];
			if (vehicleType.includes(this.data.chooseVehPlates)) {
				vehicleList.map((item) => {
					if (item !== '全部车辆') {
						this.getSuccessBill(item,this.data.chooseTime);
					}
				});
			} else {
				this.getSuccessBill(this.data.chooseVehPlates,this.data.chooseTime);
			}
		}
	},
	// 去补缴
	openVehicleOwnerService () {
		this.setData({
			isGoOwnerService: false
		});
		// 跳转到车主服务
		wx.navigateToMiniProgram({
			appId: 'wx5e73c65404eee268',
			path: 'pages/invest_list/invest_list',
			extraData: this.data.ownerServiceArrearsList[0].paySkipParams,
			success () {
			},
			fail () {
			}
		});
	}
});
