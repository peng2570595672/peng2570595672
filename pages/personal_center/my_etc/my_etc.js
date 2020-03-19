/**
 * @author 狂奔的蜗牛
 * @desc 我的ETC
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
		carList: undefined
	},
	onShow () {
		this.getMyETCList();
	},
	// 加载ETC列表
	getMyETCList () {
		util.showLoading();
		util.getDataFromServer('consumer/order/my-etc-list', {}, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				// 计算订单状态
				for (let i = 0; i < res.data.length; i++) {
					let orderInfo = res.data[i];
					orderInfo['selfStatus'] = util.getStatus(orderInfo);
					res.data[i] = orderInfo;
				}
				this.setData({
					carList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	//	查看详情
	onClickGoETCDetailHandle (e) {
		// 统计点击事件
		mta.Event.stat('016',{});
		let index = e.currentTarget.dataset.index;
		console.log(index);
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.carList[parseInt(index)].id}`);
	},
	// 查看进度
	onClickViewProcessingProgressHandle (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		app.globalData.orderInfo.orderId = obj.id;
		util.go('/pages/default/processing_progress/processing_progress');
	},
	// 继续办理
	onClickContinueHandle (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
		// 只提交了车牌 车牌颜色 收货地址 或者未签约 前往套餐选择
		// "etcContractId": "", //签约id，0表示未签约，其他表示已签约
		if (obj.shopProductId === 0 || obj.etcContractId === 0) {
			app.globalData.orderInfo.orderId = obj.id;
			util.go('/pages/default/payment_way/payment_way');
		} else if (obj.isVehicle === 0) {
			// 是否上传行驶证， 0未上传，1已上传
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
		} else if (obj.isVehicle === 1 && obj.isOwner === 1) {
			// 已上传行驶证， 未上传车主身份证
			app.globalData.orderInfo.orderId = obj.id;
			util.go('/pages/default/update_id_card/update_id_card?type=normal_process');
		}
	},
	// 新增
	onClickAddNewHandle () {
		// 统计点击事件
		mta.Event.stat('015',{});
		app.globalData.orderInfo.orderId = '';
		util.go('/pages/default/receiving_address/receiving_address');
	},
	// 恢复签约
	onClickBackToSign (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		util.showLoading('加载中');
		let params = {
			orderId: obj.id,// 订单id
			dataComplete: 1,// 订单资料是否已完善 1-是，0-否
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				app.globalData.signAContract = -1;
				util.hideLoading();
				let result = res.data.contract;
				// 签约车主服务 2.0
				app.globalData.belongToPlatform = app.globalData.platformId;
				app.globalData.orderInfo.orderId = obj.id;
				app.globalData.contractStatus = obj.contractStatus;
				app.globalData.orderStatus = obj.selfStatus;
				app.globalData.orderInfo.shopProductId = obj.shopProductId;
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
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
	},
	// 修改资料
	onClickModifiedData (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		app.globalData.orderInfo.orderId = obj.id;
		app.globalData.orderInfo.shopProductId = obj.shopProductId;
		util.go('/pages/default/information_validation/information_validation');
	}
});
