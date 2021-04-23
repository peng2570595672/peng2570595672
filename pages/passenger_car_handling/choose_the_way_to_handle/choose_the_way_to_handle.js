/**
 * @author 老刘
 * @desc 选择办理方式
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		animationLsi: undefined,
		listOfPackages: [],// 套餐列表
		regionCode: [],// 区域编码
		viewRightsAndInterests: undefined,
		details: {
			detailsTitle: '车主服务',
			list: [
				{
					logo: '/pages/passenger_car_handling/assets/not_charge.svg',
					title: '每月领驾乘险',
					describe: '10000元初始驾驶意外险，如每月无违章，额外获得5000元，最高可提升至50000元。'
				},
				{
					logo: '/pages/passenger_car_handling/assets/wechat_pay.png',
					title: '设备延保1年',
					describe: 'ETC设备非人为损坏质保延长一年，与设备质保叠加最高可达到三年质保。'
				},
				{
					logo: '/pages/passenger_car_handling/assets/not_charge.svg',
					title: '违章随时查',
					describe: '每月可免费查询车辆违章情况'
				}
			]
		}
	},
	onLoad () {
	},
	async onShow () {
		// const result = await util.initLocationInfo();
		// if (!result) return;
		this.setData({
			listOfPackages: app.globalData.newPackagePageData
		});
	},
	onClickOnlineService () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	onClickPaymentWay (e) {
		const type = e.currentTarget.dataset.type;
		util.go(`/pages/passenger_car_handling/package_the_rights_and_interests/package_the_rights_and_interests?type=${type}`);
	},
	// 查看权益详情
	viewRightsAndInterests (e) {
		// this.setData({
		// 	details: {
		// 		detailsTitle: '特色服务',
		// 		list: [
		// 			{
		// 				logo: '/pages/passenger_car_handling/assets/not_charge.svg',
		// 				title: '中国石油特惠加油',
		// 				describe: `
		// 					ETC一卡双用：通行+加油
		// 					ETC办理成功后，可在指定省份享受中国石油加油优惠0.15-0.2元/升。
		// 					持ETC卡在中石油加油站进行油费充值，使用ETC卡进行加油时即可享受加油折扣优惠。
		// 				`
		// 			}
		// 		]
		// 	}
		// });
		this.setData({
			viewRightsAndInterests: this.selectComponent('#viewRightsAndInterests')
		});
		this.data.viewRightsAndInterests.switchDisplay(true);
	},
	onClickHandle () {
		this.data.viewRightsAndInterests.switchDisplay(false);
	}
});
