const util = require('../../utils/util.js');
const app = getApp();
/**
 * 可传参数
 * btnShadowHide: 控制点击阴影部分是否关闭弹窗
 * type：选择弹窗模块
 * title：弹窗标题
 * content：弹窗内容
 * btnCancel：弹窗返回按钮文本
 * btnconfirm：弹窗确认按钮文本
 * url: 图片路径或跳转页面路径
 */
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		// tipObj: {
		// 	type: Object,
		// 	value: {}
		// }
	},

	data: {
		tipObj: {},
		mask: false,
		wrapper: false,
		paramsList: [],
		bottomingOut: false, // 触底提示
		noSliding: false, // 是否禁止底层页面滑动
		getAgreement: true, // 默认选中协议
		relationId: '',
		// 发票
		identifyingCode: '获取验证码', // 倒计时提示文本
		code: '', // 验证码
		timer: undefined, // 计时器
		time: 0 // 倒计时计数
		// ----end----
	},
	methods: {
		show (obj) {
			this.data.paramsList.push(obj);
			this.fangDou(() => {
				// 扣款失败 > 恢复签约 > 普通
				let kkIndex = this.data.paramsList.findIndex(item => item.title === '请尽快补缴欠款'); // 扣款失败
				let qyIndex = this.data.paramsList.findIndex(item => item.title === '无法正常扣款'); // 恢复签约
				this.setData({
					mask: true,
					wrapper: true,
					tipObj: kkIndex !== -1 ? this.data.paramsList[kkIndex] : qyIndex !== -1 ? this.data.paramsList[qyIndex] : this.data.paramsList[0],
					paramsList: this.data.paramsList,
					noSliding: true,
					code: ''
				});
				if (kkIndex === -1 && qyIndex === -1) {
					this.maiDian();
				}
			}, 500);
		},
		// 埋点
		maiDian () {
			if (this.data.paramsList[0].type === 'newPop') { // 埋点
				let params = this.data.paramsList.filter(item => item.type === 'newPop')[0].params;
				params['optionLabel'] = 'ENTER';
				util.buriedPoint(params, (buriedPointData) => {
					this.setData({
						relationId: buriedPointData?.id
					});
				});
			}
		},
		showCountdownPopupBox (tipObj) {
			this.data.paramsList.push(tipObj);
			this.setData({
				mask: true,
				wrapper: true,
				paramsList: this.data.paramsList,
				tipObj,
				noSliding: true,
				countdownText: `${tipObj.delayTime} 秒后自动关闭`,
				duration: parseInt(tipObj.delayTime) // 如果time未提供，默认10秒
			});
			console.log(this.data.tipObj, 'show');
			this.startCountdown();
		},
		noCountdownRequired (tipObj) {
			this.data.paramsList.push(tipObj);
			this.setData({
				mask: true,
				wrapper: true,
				paramsList: this.data.paramsList,
				tipObj,
				noSliding: true
			});
		},
		onScrolltolower () { // 滑动触底
			if (!this.data.duration && this.data.tipObj.type === 'countdownPopUpBox') {
				this.setData({
					'tipObj.showConfirmButton': true,
					'tipObj.btnconfirm': '我已知晓协议内容，同意继续办理'
				});
			}
			this.setData({
				bottomingOut: true
			});
		},
		startCountdown () {
			let countdown = this.data.duration;
			this.data.intervalId = setInterval(() => {
				countdown--;
				console.log('倒计时结束', this.data.bottomingOut);
				if (countdown <= 0) {
					console.log('倒计时结束', this.data.bottomingOut);
					if (this.data.bottomingOut) { // 触底显示按钮
						this.setData({
							'tipObj.showConfirmButton': true,
							'tipObj.btnconfirm': '我已知晓协议内容，同意继续办理'
						});
					}
					this.setData({
						duration: 0,
						countdownText: ``
					});
					clearInterval(this.data.intervalId);
				} else {
					this.setData({
						countdownText: `(${countdown} 秒倒计时)`
					});
				}
			}, 1000);
		},
		onConfirm () {
			if (this.data.tipObj.type === 'accidentInsurance') {
				this.hide(false);
				const that = this;
				wx.makePhoneCall({
					phoneNumber: '1234567890', // 需要拨打的电话号码
					success () {
						// 拉起拨打成功后的回调
						that.triggerEvent('confirmHandle', true); // 拨打成功
					},
					fail () {
						// 拉起拨打失败的回调
						that.triggerEvent('confirmHandle', false); // 拨打成功
						console.log('拨打电话失败');
					}
				});
			}
			if (this.data.tipObj.type === 'countdownPopUpBox') {
				if (!this.data.tipObj.showConfirmButton) return;
				this.triggerEvent('confirmHandle', 'readDone'); // 阅读完成
				this.hide(false);
			}
			if (this.data.tipObj.type === 'noCountdownRequired') {
				this.triggerEvent('confirmHandle'); // 关闭
				this.hide(false);
			}
		},
		openFullScreenImage (e) {
			const current = e.currentTarget.dataset.src; // 获取当前点击图片的URL
			const urls = [current]; // 多张时可以滑动预览
			wx.previewImage({
				current,
				urls,
				fail: (err) => {
					console.error('打开图片失败:', err);
				}
			});
		},
		noSliding () {},
		// 防抖
		fangDou (fn, time) {
			let that = this;
			return (function () {
				if (that.data.timeout) {
					clearTimeout(that.data.timeout);
				}
				that.data.timeout = setTimeout(() => {
					fn.apply(this, arguments);
				}, time);
			})();
		},
		// 关闭弹窗
		hide (e) {
			app.globalData.isShowDeviceUpgradePop = true;
			this.setData({
				wrapper: false,
				getAgreement: true
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				if (this.data.intervalId) {
					clearInterval(this.data.intervalId);
				}
				if (this.data.tipObj.type === 'one' && this.data.tipObj.NoIcon) {
					this.setData({ paramsList: [] });
					return;
				}
				this.triggerEvent('cancelHandle');
				if (e) { // 判断点击此方法关闭
					let title = e.currentTarget.dataset.title;
					let paramsList = this.data.paramsList.filter(item => item.title !== title);
					if (paramsList?.length !== 0) {
						this.setData({
							paramsList
						});
						this.show(paramsList[0]);
					} else {
						this.setData({
							paramsList: []
						});
					}
				} else {
					this.setData({
						paramsList: []
					});
				}
			}, 400);
		},
		// 小程序页面内部跳转	跳转 指定页面
		go (e) {
			let src = e.currentTarget.dataset.src;
			if (src) {
				util.go(src);
				this.setData({
					mask: false,
					wrapper: false
				});
			} else {
				this.hide(false);
			}
			if (this.data.tipObj.title === '提交审核提醒') {
				this.data.tipObj.callBack();
			}
		},
		// 中信 办理提醒
		citicBank () {
			// 跳转保证金支付页
			this.triggerEvent('confirmHandle', 'cictBank');
			this.hide(false);
		},
		// 前去补缴
		supplementaryPayment () {
			this.hide(false);
			util.go('/pages/personal_center/arrears_bill/arrears_bill');
		},
		// 恢复签约
		resumeSigning () {
			this.triggerEvent('onHandle', this.data.tipObj.params);
			this.hide(false);
		},
		handleConfirm () {
			this.hide(false);
			if (this.data.tipObj?.params?.type === 1) {
				util.go('/pages/personal_center/arrears_bill/arrears_bill');
			} else {
				this.triggerEvent('onHandle');
			}
		},
		// 设备升级
		deviceUpgrade () {
			this.fangDou(() => {
				util.go(`/pages/device_upgrade/package/package`);
				this.hide(false);
			}, 300);
		},
		// 授权提醒
		async authorizeTip () {
			if (!this.data.getAgreement) return util.showToastNoIcon('请先同意勾选协议');
			let that = this;
			let params = that.data.paramsList.filter(item => item.type === 'newPop' || item.type === 'nine')[0].params;
			let res = await util.getDataFromServersV2('/consumer/order/pingan/get-bind-veh-url', {});
			if (!res) return;
			if (res.code === 0) {
				params['optionLabel'] = 'CLICK';
				params['relationId'] = that.data.paramsList[0].type === 'nine' ? '' : that.data.relationId;
				util.buriedPoint(params);
				// 跳转 h5
				util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data)}`);
				this.hide(false);
			} else {
				util.showToastNoIcon(res.message);
			}
		},
		handleProtocol () {
			util.go('/pages/agreement_documents/equity_agreement/equity_agreement?type=QTTwoPercent');
		},
		handleFactoringAgreement () {
			util.go('/pages/agreement_documents/equity_agreement/equity_agreement?type=factoringAgreement');
		},
		// 同意协议修改2%存量用户签约状态
		async handleTwoPercentSign () {
			let res = await util.getDataFromServersV2('/consumer/order/sync-two-percent-sign-status', {
				platformId: app.globalData.platformId
			});
			if (!res) return;
			if (res.code === 0) {
				this.hide(false);
			} else {
				util.showToastNoIcon(res.message);
			}
		},
		// 协议选中控制
		isSelectAgreement () {
			this.setData({
				getAgreement: !this.data.getAgreement
			});
		},
		// 前去协议页
		goAgreement (e) {
			let type = e.currentTarget.dataset.type;
			switch (type) {
				case '1': // 平安获客（平安 隐私协议）
					util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=pAbindGuests`);
					break;
				case '2': // 民生细则点击跳转
					util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=minShengbyLaws`);
					break;
				case '3': // 协议续签 ETC+用户服务协议
					util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=renewWhitelistService`);
					break;
				case '4': // 协议续签 用户隐私协议
					util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=renewWhitelistPrivacy`);
					break;
				default:
					break;
			}
		},
		// 拨打电话 | 注销账号须知
		pubFunc1 (e) {
			this.hide(false);
			switch (e.currentTarget.dataset.type) {
				case 'callPhone':
				case 'logOffTip':
				case 'logOffTip2':
				case 'xinKeUseer':
					this.data.tipObj.callBack();
					break;
				default:
					break;
			}
		},
		// 回调共用方法
		callBackPub () {
			this.hide(false);
			this.data.tipObj.callBack();
		},
		// 广发 小程序跳转
		async guanFaFunc () {
			let that = this;
			let res = await util.getDataFromServersV2('consumer/order/apply/gf/bank-card', {
				orderId: app.globalData.orderInfo.orderId
			});
			if (!res) return;
			if (res.code === 0) {
				util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data.applyUrl)}`);
				that.hide(false);
			} else {
				util.showToastNoIcon(res.message);
			}
		},
		// 协议续签
		renewWhitelist () {
			this.hide(false);
			wx.setStorageSync('renewWhitelist', true);
			if (this.data.paramsList[0].callBack) {
				this.data.paramsList[0].callBack();
			}
		},
		// AI回访打电话
		async aiReturn () {
			if (this.data.tipObj?.aiFlag) { // 跳过
				this.data.paramsList[0].callBack();
			} else {
				const res = await util.getDataFromServersV2('consumer/system/aiReturnVisits/callBack', {
					orderId: this.data.paramsList[0].params.orderId
				});
				// if (!res) return;
				this.hide(false);
				if (res.code === 1) {
					this.data.paramsList[0].callBack();
				} else if (res.code === 0) {
					// 拨打成功，接听电话
					util.showToastNoIcon(res.message);
				} else {
					util.showToastNoIcon(res.message);
				}
			}
		},
		// -----------------------------发票------------------------------------
		setTimer () { // 设置倒计时
			if (this.data.timer) {
				clearInterval(this.data.timer);
				this.setData({
					timer: undefined
				});
			}
			this.data.time = 60;
			this.data.timer = setInterval(() => {
				if (this.data.time === 0) {
					clearInterval(this.data.timer);
					this.setData({
						timer: undefined,
						identifyingCode: '获取验证码'
					});
				} else {
					this.setData({
						time: this.data.time - 1,
						identifyingCode: this.data.time + '秒'
					});
				}
			}, 1000);
		},
		// 获取验证码
		async getCode () {
			if (!this.data.tipObj.content.phoneNumber || this.data.tipObj.content.phoneNumber.length === 0) {
				util.showToastNoIcon('手机号不能为空!');
				return;
			}
			util.showLoading({
				title: '获取中...'
			});
			wx.hideLoading();
			const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/send-sms', {
				receivePhone: this.data.tipObj.content.phoneNumber
			}, 'POST', true);
			if (!result) return;
			if (result.code === 0) {
				wx.hideLoading();
				this.setData({code: ''});
				this.setTimer();
			} else {
				wx.hideLoading();
				util.showToastNoIcon(result.message);
			}
		},
		// 手机验证码输入
		codeValueChange (e) {
			let code = e.detail.value.trim();
			if (code.length >= 4) {
				this.setData({
					code
				});
			} else {
				this.setData({
					code
				});
			}
		},
		callBackInvoice () {
			let that = this;
			if (!that.data.code) return;
			that.setData({
				isRequest: true
			});
			util.showLoading({
				title: '验证码校验中...'
			});
			// 校验验证码是否合法
			util.getDataFromServer('consumer/order/after-sale-record/check-sms', {
				receivePhone: that.data.tipObj.content.phoneNumber,
				code: this.data.code
			}, () => {
				util.showToastNoIcon('校验验证码失败！');
			}, (res) => {
				if (res.code === 0) {
					util.hideLoading();
					that.data.tipObj.callBack();
				} else {
					util.hideLoading();
					that.setData({
						isRequest: false
					});
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken, () => {
				that.setData({
					isRequest: false
				});
			});
		}
		// -----------------------------end------------------------------------

	}
});
