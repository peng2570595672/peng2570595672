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
		vehicleList: ['全部车辆'],
		chooseTime: ''
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
			chooseTime: `${year}-${util.formatNumber(month)}`
		});
		this.getMyETCList();
	},
	// 加载ETC列表
	getMyETCList () {
		util.showLoading();
		util.getDataFromServer('consumer/order/my-etc-list', {}, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				// 过滤未激活订单
				let obuStatusList;
				// obuStatusList = res.data.filter(item => item.obuStatus === 1); // 正式数据
				obuStatusList = res.data.filter(item => item.etcChannelCode === '1'); // 测试数据处理
				console.log(obuStatusList)
				if (obuStatusList.length === 0) { // 没有激活车辆
				} else {
					// 需要过滤未激活的套餐
					obuStatusList.map((item) => {
						this.data.vehicleList.push(item.vehPlates);
						this.setData({
							vehicleList: this.data.vehicleList
						});
					});
					this.setData({
						orderList: res.data
					});
					this.getFailBill(0);// 0  全部车辆
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 失败账单列表
	getFailBill (index) {
		// 未完成
		console.log(index);
		console.log(this.data.vehicleList[index]);
		let vehPlate,channel;
		if (index === 0) {
		} else {
			vehPlate = this.data.vehicleList[index];
			channel = this.data.orderList.filter(item => item.vehPlates === vehPlate);
			console.log(channel)
		}
		let params = {
			vehPlate: vehPlate,
			channel: channel[0].etcChannelCode,
			page: this.data.page,
			pageSize: this.data.pageSize
		};
		// 优先把失败的展示出来吧，超过20条了全部展示
		util.getDataFromServer('consumer/etc/get-fail-bill', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					failBillList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 账单详情
	goDetails (e) {
		// 统计点击事件
		mta.Event.stat('018',{});
		util.go('/pages/personal_center/order_details/order_details');
	},
	// 去补缴
	go () {
		// 统计点击事件
		mta.Event.stat('019',{});
		util.go('/pages/personal_center/payment_confirmation/payment_confirmation');
	},
	// 下拉选择
	selectedItem (e) {
		console.log(e);
		if (!e.detail.selectedId) {
			let index = this.data.vehicleList.findIndex((value) => value === e.detail.selectedTitle);
			console.log(index);
			if (index === 0) { // 统计点击全部车辆
				// 统计点击事件
				mta.Event.stat('017',{});
			}
			this.getFailBill(index);
		} else {
			const month = e.detail.selectedId.match(/-(\S*)/)[1];
			const id = e.detail.selectedId.match(/(\S*)-/)[1];
			console.log(month);
			console.log(`${this.data.year - id}-${util.formatNumber(month)}`);
		}
	}
});
