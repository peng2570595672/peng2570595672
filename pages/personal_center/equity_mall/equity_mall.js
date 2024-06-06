const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isRequest: false,// 是否请求
		rechargeInfo: {},
		isOpeningInterest: false // 是否开通过通通券抵扣
	},
	async onShow () {
		await this.getAccount();
	},
	// 获取用户商城权益金
	async getAccount () {
		const result = await util.getDataFromServersV2('consumer/member/member/rights/account', {platformId: app.globalData.platformId});
		if (result.code === 0) {
			if (result.data?.record) {
				const index = result.data?.record.findIndex(item => item.transMark === 5);
				this.setData({
					isOpeningInterest: index !== -1
				});
			}
			this.setData({
				rechargeInfo: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	handleMall () {
		const url = `https://${app.globalData.test ? 'etctest' : 'etc'}.cyzl.com/${app.globalData.test ? 'etc2-html' : 'wetc'}/equity_mall/index.html#/?auth=${app.globalData.userInfo.accessToken}&platformId=${app.globalData.platformId}`;
		util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
	},
	async handleTTQMini () {
		const total = this.data.rechargeInfo?.account?.balance || 0;
		if (total >= 3180 && !this.data.isOpeningInterest) {
			util.alert({
				title: '',
				content: '首次进入默认将扣减31.8商城权益金兑换中免折扣优惠',
				showCancel: true,
				cancelText: '我不愿意',
				confirmText: '好的',
				confirm: () => {
					this.handleMini();
				}
			});
		} else {
			this.handleMini();
		}
	},
	async handleMini () {
		if (!this.data.isOpeningInterest && this.data.rechargeInfo?.account?.id) {
			if (this.data.isRequest) return;
			this.setData({
				isOpeningInterest: true
			});
			const result = await util.getDataFromServersV2('consumer/member/into/freeMall', {accountId: this.data.rechargeInfo?.account?.id});
			this.setData({
				isOpeningInterest: false
			});
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			} else {
				this.setData({
					isOpeningInterest: true
				});
			}
		}
		const total = this.data.rechargeInfo?.account?.balance || 0;
		if ((total < 3180 && !this.data.isOpeningInterest) || !this.data.rechargeInfo?.account?.id) {
			util.alert({
				title: '',
				content: '当前商城权益金不足以开通免税商品折扣，继续进入商城将以非折扣价购买商品',
				showCancel: true,
				confirmText: '继续进入',
				confirm: () => {
					this.openMini();
				}
			});
		} else {
			this.openMini();
		}
	},
	openMini () {
		wx.openEmbeddedMiniProgram({
			appId: 'wx7e5d0f72c61b0c17',
			path: 'pages/cdf/main/main',
			envVersion: app.globalData.test ? 'trial' : 'release',
			extraData: {},
			fail () {
				util.showToastNoIcon('调起通通券小程序失败, 请重试！');
			}
		});
	},
});
