const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		rightsAndInterestsVehicleList: undefined, // 权益车辆列表
		basicServicesList: [
			{title: 'ETC设备', img: 'etc_equipment', statisticsEvent: 'basic_services_for_etc_equipment'},
			{title: '在线客服', img: 'online_icon', statisticsEvent: 'basic_services_for_online_icon'},
			{title: '开发票', img: 'invoice', statisticsEvent: 'basic_services_for_invoice'},
			{title: '质保两年', img: 'quality_assurance', statisticsEvent: 'basic_services_for_quality_assurance'},
			{title: '通行折扣', img: 'pass_the_discount', statisticsEvent: 'basic_services_for_pass_the_discount'}
		],
		payInterest: {
			describeList: [
				{title: '高速通行9.5折', subTitle: '全国高速走ETC车道享受不低于95折优惠。使用说明：进出高速收费站时走ETC通道'},
				{title: '设备质保两年', subTitle: 'ETC设备两年内非人为损坏可提供保修服务。如有需要请联系 '}
			]
		}
	},
	onLoad (options) {
		this.getOrderRelation();
	},
	getOrderRelation () {
		util.showLoading();
		util.getDataFromServer('consumer/voucher/rights/get-order-relation', {
			platformId: app.globalData.platformId
		}, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				if (res.data) {
					app.globalData.rightsAndInterestsVehicleList = res.data;
					this.setData({
						rightsAndInterestsVehicleList: res.data
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 跳转
	go (e) {
		let type = +e.currentTarget.dataset['type'];
		wx.uma.trackEvent(this.data.basicServicesList[type - 1].statisticsEvent);
		switch (type) {
			case 1:
				util.go(`/pages/personal_center/my_etc/my_etc`);
				break;
			case 2:
				util.go(`/pages/web/web/web?type=online_customer_service`);
				break;
			case 3:
				wx.showActionSheet({
					itemList: ['开服务费发票', '开通行费发票'],
					success: (res) => {
						wx.uma.trackEvent(res.tapIndex ? 'basic_services_for_make_invoice' : 'basic_services_for_make_etc_invoice');
						if (res.tapIndex === 0) {
							util.go(`/pages/personal_center/invoice_issued_list/invoice_issued_list`);
						} else {
							// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
							wx.navigateToMiniProgram({
								appId: 'wx9040bb0d3f910004',
								path: 'pages/index/index',
								envVersion: 'release', // 正式版
								fail () {
									util.showToastNoIcon('调起小程序失败, 请重试！');
								}
							});
						}
					}
				});
				break;
			case 4:
				this.setData({
					showDetailWrapper: true,
					showDetailMask: true,
					iconType: type
				});
				break;
			case 5:
				this.setData({
					showDetailWrapper: true,
					showDetailMask: true,
					iconType: type
				});
				break;
		}
	},
	online () {
		let url = 'online_customer_service';
		wx.uma.trackEvent('basic_services_for_quality_assurance_to_server');
		util.go(`/pages/web/web/web?type=${url}`);
	},
	// 关闭详情
	close () {},
	hide () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	}
});
