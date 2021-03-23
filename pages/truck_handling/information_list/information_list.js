const util = require('../../../utils/util.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
	orderInfo: undefined,
	isRequest: false,
	available: false,
	contractStatus: false //签约状态   签约状态 -1 签约失败 0发起签约 1已签约 2解约
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
	  this.setData({
		  contractStatus: app.globalData.contractStatus
	  });
	this.getETCDetail();
  },
	// 加载订单详情
	getETCDetail () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '16',
			needAllInfo: true
		}, () => {
			util.showToastNoIcon('获取订单详情失败！');
		}, (res) => {
			if (res.code === 0) {
				let result = res.data.base;
				let orderInfo = result.orderInfo
				let vehPlates = result.vehPlates;
				this.setData({
					orderInfo: orderInfo,
					vehPlates: vehPlates
				});
				this.availableCheck(orderInfo,res.data.vehicle);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	availableCheck(orderInfo,vehicleInfo) {
		if(vehicleInfo.isTraction === 0 && orderInfo.isOwner === 1 && orderInfo.isVehicle === 1 && orderInfo.isHeadstock === 1){
			this.setData({
				available: true
			})
		} else if (vehicleInfo.isTraction === 1 && orderInfo.isTransportLicense === 1 && vehicleInfo.isTraction === 0 && orderInfo.isOwner === 1 && orderInfo.isVehicle === 1 && orderInfo.isHeadstock === 1) {
			this.setData({
				available: true
			})
		}
		if(orderInfo.isOwner === 1 && orderInfo.isVehicle === 1 && orderInfo.isHeadstock === 1){
			if(vehicleInfo.isTraction === 0 || (vehicleInfo.isTraction === 1 && orderInfo.isTransportLicense === 1) ){
				this.setData({
					available: true
				})
			}
		}
	},
	// 跳转
	go (e) {
		if(this.data.contractStatus === 1) {
			util.showToastNoIcon('签约成功，不可修改！');
		} else {
			let url = e.currentTarget.dataset['url'];
			util.go(`/pages/truck_handling/${url}/${url}?vehPlates=${this.data.orderInfo.vehPlates}&vehColor=${this.data.orderInfo.vehColor}`);
		}
	},
	// 微信签约
	onclickSign () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		app.globalData.signAContract = -1;
		util.showLoading('加载中');
		let params = {
			orderId: app.globalData.orderInfo.orderId,// 订单id
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
			util.hideLoading();
			this.setData({isRequest: false});
		}, (res) => {
			if (res.code === 0) {
				util.hideLoading();
				let result = res.data.contract;
				// 签约车主服务 2.0
				if (result.version === 'v2') {
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/route/index',
						extraData: result.extraData,
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				} else { // 签约车主服务 3.0
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/etc/index',
						extraData: {
							preopen_id: result.extraData.peropen_id
						},
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				}
			} else {
				util.hideLoading();
				this.setData({isRequest: false});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
		});
	},
});
