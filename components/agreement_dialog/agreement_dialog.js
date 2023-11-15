const util = require('../../utils/util.js');
const app = getApp();
let type = 1;
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
	},

	data: {
		type: 1,
		mask: false,
		wrapper: false
	},
	methods: {
		ok (e) {
			this.triggerEvent('onHandle');
		},
		show () {
			const showToast = wx.getStorageSync('showEtcToast');
			if (showToast && app.globalData.isToastAgreement) {
				return;
			}
			if (JSON.stringify(app.globalData.myEtcList) === '{}' || app.globalData.myEtcList.length === 0) {
				// 未登录 || 没有订单
				type = 1;
			} else {
				const list = app.globalData.myEtcList.filter(item => item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5); // 1 已激活  2 恢复订单  5 预激活
				if (list.length > 0) {
					this.initData(list[0]);
				} else {
					// 没有激活订单
					const firstOrder = app.globalData.myEtcList[0];
					this.initData(firstOrder);
				}
			}
			wx.setStorageSync('showEtcToast', true);
			app.globalData.isToastAgreement = false;
			this.setData({
				type,
				mask: true,
				wrapper: true
			});
		},
		initData (info) {
			// 有激活订单
			if (info.isNewTrucks === 1) { // 货车
				// 免费
				if (info.environmentAttribute === 2) {
					// 免费
					type = 2;
				} else {
					type = 3;
				}
				// 黔通卡ETC用户协议
			} else {
				if (info.environmentAttribute === 2) {
					// 免费
					if (info.obuCardType === 1) {
						// 黔通免费
						type = 4;
					} else {
						type = 5;
					}
				} else {
					if (info.isSignTtCoupon === 1) {
						// 通通券
						type = 6;
					} else {
						if (info.obuCardType === 1) { // 黔通
							type = 7;
						} else {
							type = 8;
						}
					}
				}
			}
		},
		hide (e,flag) {
			app.globalData.isToastAgreement = true;
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('cancelHandle');
			}, 400);
		},
		handleAgreement () {
			console.log(type);
			if (type === 1) {
				util.go('/pages/agreement_documents/self_buy_equipmemnt_agreement/self_buy_equipmemnt_agreement');
			} else if (type === 2 || type === 3) {
				util.go('/pages/truck_handling/agreement/agreement');
			} else if (type === 4) {
				util.go('/pages/agreement_documents/free_equipment_agreement/free_equipment_agreement');
			} else if (type === 5 || type === 8) {
				util.go('/pages/agreement_documents/agreement/agreement');
			} else if (type === 6) {
				util.go('/pages/agreement_documents/self_buy_equipmemnt_agreement/self_buy_equipmemnt_agreement');
			} else if (type === 7) {
				util.go('/pages/agreement_documents/new_self_buy_equipmemnt_agreement/index');
			} else {
				util.go('/pages/agreement_documents/agreement/agreement');
			}
		},
		handleQiantongAgreement () {
			if (type === 2 || type === 4) {
				util.go('/pages/truck_handling/agreement_for_qiantong_to_free/agreement');
			} else {
				util.go('/pages/truck_handling/agreement_for_qiantong_to_charge/agreement');
			}
		},
		handlePrivacy () {
			util.go('/pages/agreement_documents/privacy_agreement/privacy_agreement');
		}
	}
});
