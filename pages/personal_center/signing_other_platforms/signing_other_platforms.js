import {showToastNoIcon} from '../../../utils/utils';

/**
 * @author 老刘
 * @desc 签约ETC+
 */
const app = getApp();
Page({
	data: {
		isAuth: false,
		isSign: false,
		isMainProcess: false,
		parameter: {},
		info: {}
	},
	async onLoad (options) {
		this.setData({
			isMainProcess: !!options.type,
			parameter: {
				mobilePhone: app.globalData.userInfo.mobilePhone,
				orderId: app.globalData.orderInfo.orderId,
				btnStyle: 'width: 152rpx !important;' +
					'height: 64rpx !important;' +
					'padding: 0rpx !important;' +
					'box-sizing: border-box !important;' +
					'background:#5EBE68 !important;' +
					'color: #fff !important;' +
					'border-radius: 16rpx !important;' +
					'font-size: 28rpx !important;' +
					'font-family: PingFang SC-Regular, PingFang SC !important;' +
					'font-weight: 400 !important;' +
					'color: #FFFFFF !important;', // 自定义颜色
				authText: '授权使用',// 授权按钮文案  默认:'去签约'
				signText: '立即签约',// 签约按钮文案  默认:'签约'
				signSuccessText: '',// 签约成功按钮文案  默认:'签约成功'
				isTest: app.globalData.test// true: 测试环境  不填或false: 正式环境
			}
		});
	},
	handleSign () {
		if (!this.data.isAuth) {
			showToastNoIcon('请先完成授权');
		}
	},
	handleSuccess () {
		// if (!this.data.isAuth && !this.data.isSign) {
		// 	showToastNoIcon('您还未完成全部的操作哦');
		// 	return;
		// }
		wx.redirectTo({
			url: `/pages/personal_center/sign_successful/sign_successful?type=${this.data.isMainProcess ? 'main' : 'other'}`
		});
	},
	getSigningStatus (res) {
		console.log('签约成功');
		wx.redirectTo({
			url: `/pages/personal_center/sign_successful/sign_successful?type=${this.data.isMainProcess ? 'main' : 'other'}`
		});
		this.setData({
			isSign: true
		});
	},
	getAuthStatus (res) {
		console.log('授权成功');
		this.setData({
			isAuth: true
		});
	}
});
