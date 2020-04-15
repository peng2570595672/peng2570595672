const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
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
		failBillList: [],
		failBillMessage: '',
		successBillMessage: '',
		successBillList: [],
		allMoney: 0, // 总额
		vehicleList: ['全部车辆'],
		chooseTime: '',
		chooseVehPlates: '全部车辆'
	},
	onLoad () {
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
		this.setData({
			[`dropDownMenuTitle[0]`]: this.data.vehicleList[0],
			[`dropDownMenuTitle[1]`]: `${year}年${month}月`,
			year: `${year}`,
			chooseTime: `${year}${util.formatNumber(month)}`
		});
	},
	onShow () {
		this.setData({
			successBillList: []
		});
		if (app.globalData.userInfo.accessToken) {
			this.getMyETCList();
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
				app.globalData.myEtcList = res.data;
				this.getMyETCList();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 加载ETC列表
	getMyETCList () {
		// 过滤未激活订单
		let obuStatusList;
		// obuStatusList = res.data.filter(item => item.obuStatus === 1); // 正式数据
		obuStatusList = app.globalData.myEtcList.filter(item => item.etcContractId !== 0); // 测试数据处理
		if (obuStatusList.length > 0) {
			// 需要过滤未激活的套餐
			this.setData({
				orderList: obuStatusList
			});
			let date = new Date();
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			if (this.data.chooseVehPlates !== '全部车辆') {
				this.getSuccessBill(this.data.chooseVehPlates,this.data.chooseTime);
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
			this.data.orderList.map((item) => {
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
	getFailBillMessage (channel) {
		let params = {
			channels: channel
		};
		util.getDataFromServer('consumer/etc/get-fail-bill-info', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					failBillMessage: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 成功账单列表
	getSuccessBill (vehPlates,month) {
		let channel;
		channel = this.data.orderList.filter(item => item.vehPlates === vehPlates);
		let params = {
			vehPlate: vehPlates,
			month: month,
			channel: channel[0].obuCardType
		};
		util.getDataFromServer('consumer/etc/get-bill', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					successBillList: this.data.successBillList.concat(res.data)
				});
				// 数组去重
				let hash = [];
				this.data.successBillList = this.data.successBillList.reduce((item1, item2) => {
					hash[item2['id']] ? '' : hash[item2['id']] = true && item1.push(item2);
					return item1;
				}, []);
				this.setData({
					successBillList: this.data.successBillList
				});
				let allMoney = 0;
				this.data.successBillList.map((item) => {
					allMoney += item.etcMoney;
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
	goDetails (e) {
		let model = e.currentTarget.dataset.model;
		// 统计点击事件
		mta.Event.stat('018',{});
		util.go(`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
	},
	// 下拉选择
	selectedItem (e) {
		if (!e.detail.selectedId) {
			let index = this.data.vehicleList.findIndex((value) => value === e.detail.selectedTitle);
			if (index === 0) { // 统计点击全部车辆
				// 统计点击事件
				mta.Event.stat('017',{});
				this.setData({
					chooseVehPlates: '全部车辆'
				});
				this.data.vehicleList.map((item) => {
					if (item !== '全部车辆') {
						this.getSuccessBill(item,this.data.chooseTime);
					}
				});
				this.getMessage('全部车辆',this.data.chooseTime);
			} else {
				this.setData({
					failBillList: [],
					successBillList: [],
					chooseVehPlates: this.data.vehicleList[index]
				});
				this.getSuccessBill(this.data.vehicleList[index],this.data.chooseTime);
				this.getMessage(this.data.vehicleList[index],this.data.chooseTime);
			}
		} else {
			const month = e.detail.selectedId.match(/-(\S*)/)[1];
			const id = e.detail.selectedId.match(/(\S*)-/)[1];
			this.setData({
				chooseTime: `${this.data.year - id}${util.formatNumber(month)}`,
				successBillList: []
			});
			if (this.data.chooseVehPlates === '全部车辆') {
				this.data.vehicleList.map((item) => {
					if (item !== '全部车辆') {
						this.getSuccessBill(item,this.data.chooseTime);
					}
				});
				this.getMessage('全部车辆',this.data.chooseTime);
			} else {
				this.getMessage(this.data.chooseVehPlates,this.data.chooseTime);
				this.getSuccessBill(this.data.chooseVehPlates,this.data.chooseTime);
			}
		}
	}
});
