const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		isAttention: 0, // 关注状态 1-已关注，0-未关注
		userInfo: undefined, // 用户信息
		showDetailWrapper: false,
		showDetailMask: false
	},
	onLoad () {
		let that = this;
		wx.getSetting({
			success (res){
				if (res.authSetting['scope.userInfo']) {
					// 已经授权，可以直接调用 getUserInfo 获取头像昵称
					wx.getUserInfo({
						success: function(res) {
							console.log(res);
							that.setData({
								userInfo: res.userInfo
							});
							that.submitUserInfo(res);
						}
					})
				}
			}
		});
		this.getMemberBenefits();
	},
	submitUserInfo (user) {
		util.showLoading();
		let params = {
			encryptedData: user.encryptedData,
			iv: user.iv
		};
		util.getDataFromServer('consumer/member/applet/update-user-info', params, () => {
			util.showToastNoIcon('提交用户信息失败！');
		}, (res) => {
			if (res.code === 0) {
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取会员信息
	getMemberBenefits () {
		util.showLoading();
		util.getDataFromServer('consumer/member/member-status', {}, () => {
			util.showToastNoIcon('获取会员信息失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					isAttention: res.data.attentionStatus
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	bindGetUserInfo (e) {
		this.setData({
			userInfo: e.detail.userInfo
		});
		if (e.detail.userInfo) {
			this.submitUserInfo(e.detail);
		}
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		let type = e.currentTarget.dataset.type;
		util.go(`/pages/personal_center/${url}/${url}`);
	},
	// 扫码
	scan () {
		util.showLoading({title: '正在识别'});
		// 统计点击事件
		mta.Event.stat('023',{});
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: (res) => {
				console.log(res);
				let key = res.result.match(/(\S*)=/);
				let val = res.result.match(/=(\S*)/);
				if (key && val && key[1] && val[1].length === 18 && key[1] === 'orderId') {
					util.getDataFromServer('consumer/member/bind-order', {
						orderId: val[1]
					}, () => {
						util.hideLoading();
					}, (res) => {
						util.hideLoading();
						if (res.code === 0) {
							app.globalData.orderInfo.orderId = val[1];
							util.go('/pages/personal_center/my_etc_detail/my_etc_detail');
						} else {
							util.showToastNoIcon(res.message);
						}
					}, app.globalData.userInfo.accessToken);
				} else {
					util.hideLoading();
					util.showToastNoIcon('不支持的数据格式');
				}
			},
			fail: (res) => {
				util.showToastNoIcon('扫码失败');
			}
		});
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 监听返回按钮
	onClickBackHandle () {
		wx.navigateBack({
			delta: 1
		});
	},
	// 关闭详情
	hide () {
		this.setData({
			showDetailWtapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 0);
	}
});
