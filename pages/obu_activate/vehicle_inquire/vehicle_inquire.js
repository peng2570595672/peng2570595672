const app = getApp();
const util = require('../../../utils/util.js');
// 倒计时计时器
let timer;
Page({
	data: {
		signed: 1,	// 是否已签约
		sysPlatform: null,	// 签约信息（比如appId、path 等数据
		alertMask: false, // 控制手机短信验证弹窗
		alertWrapper: false, // 控制手机短信验证弹窗
		showKeyboard: false, // 是否显示键盘
		currentIndex: -1, // 当前选中的输入车牌位置
		carNoStr: '', // 车牌字符串
		carNo: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
		mobilePhone: '',
		showPhone: '',
		channel: '',
		serverId: '',
		qtLimit: '',
		channelName: '',
		time: 59,// 倒计时
		identifyingCode: '获取验证码',// 获取验证码文字
		isGetIdentifyingCoding: false,// 当前是否在获取验证码
		code: '', // 验证码
		// smsToken: '',
		available: 0,
		vehColor: 0,	// 车牌颜色 0:蓝色 1:黄色 4:渐变绿色  3:白牌
		inputCodeFocusing: 0,	// 弹出框里 验证码文本框获取焦点标识位
		isNewPowerCar: 0, // 是否为新能源
		alertFirstShow: 1,
		isRelease: 0,	// TODO 用于测试显示当前环境是否为正式版环境
		appid: '',
		choiceEquipment: undefined,
		getAgreement: true	// 是否接收协议
	},
	onLoad () {
		// // TODO TEST CODE
		// app.globalData.plate = '湘Z00001';

		// TODO TEST CODE
		this.setData({isRelease: !global.IS_TEST});

		if (app.globalData.plate) {
			let carNoStr = app.globalData.plate;
			let carNo = carNoStr.split('');
			if (carNo.length < 8) carNo.push('');
			this.setData({carNo, carNoStr});
		}
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#fff',
			backgroundColorBottom: '#f6f7f8'
		});
		this.selectComponent('#agreement-dialog').show();
	},
	// 拦截点击非透明层空白处事件
	onClickTranslucentHandle () {
		this.data.choiceEquipment.switchDisplay(false);
	},
	// 分享功能
	onShareAppMessage () {
		return {
			path: '/pages/Home/Home'
		};
	},
	inputCode () {
		this.setData({
			alertFirstShow: 0,
			inputCodeFocusing: 1
		});
	},
	// onShow () {
	// 	// 从其他小程序返回
	// 	if (app.globalData.backFromMiniProgram) {
	// 		this.getStatus();
	// 	}
	// },
	// 打开弹窗
	// 关闭弹窗
	winHide () {
		this.setData({
			isOpenAccounting: false,
			alertWrapper: false
		});
		setTimeout(() => {
			this.setData({
				alertMask: false
			});
		}, 400);
	},
	// 车牌输入回调
	valueChange (e) {
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(e.detail.index, this.data.currentIndex);
		}
		if ((e.detail.carNo[0] !== '粤' || e.detail.carNo[1] !== 'Z') && (e.detail.carNo[6] === '澳' || e.detail.carNo[6] === '港')) {
			util.showToastNoIcon('车牌输入错误');
			this.setData({
				carNo: ['', '', '', '', '', '', '', ''],
				carNoStr: '',
				showKeyboard: false,
				currentIndex: -1
			});
		} else {
			this.setData({
				carNo: e.detail.carNo,
				carNoStr: e.detail.carNo.join(''),
				currentIndex: e.detail.index,
				showKeyboard: e.detail.show
			});
		}
		// 输入车牌到最后一位时隐藏键盘
		if (this.data.currentIndex === 7 && !this.data.carNo[7]) {
			this.setData({
				showKeyboard: false,
				currentIndex: -1
			});
		}
		// 兼容处理是否显示或者隐藏键盘
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
		if (this.data.carNoStr.length === 8) {
			this.setData({vehColor: 4});
		} else {
			if (this.data.carNo[6] === '警') {
				this.setData({vehColor: 3});
			} else if (this.data.carNo[6] === '港' || this.data.carNo[6] === '澳') {
				this.setData({vehColor: 2});
			} else {
				this.setData({vehColor: 0});
			}
		}
		// 键盘关闭
		if (!this.data.showKeyboard) {
			this.setData({currentIndex: -1});
		}
	},
	setCurrentCarNo (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(index, this.data.currentIndex);
		}
		this.setData({
			currentIndex: index
		});
		if (!this.data.showKeyboard) {
			this.setData({
				showKeyboard: true
			});
			if (app.globalData.SDKVersion < '2.6.1') {
				let keyboard = this.selectComponent('#keyboard');
				keyboard.showMethod(this.data.showKeyboard);
			}
		}
	},
	// 确定按钮点击事件
	go () {
		if (this.data.getAgreement) {
			if (!this.data.showKeyboard && /^[78]$/.test(this.data.carNoStr.length)) {
				wx.uma.trackEvent('index_confirm');
				this.fetchOrder();
			}
		} else {
			util.showToastNoIcon('请同意并勾选协议！');
		}
	},
	fetchOrder () {
		let carNo = this.data.carNoStr;
		let vehColor = this.data.vehColor;
		util.showLoading();
		// util.getDataFromServer('consumer-etc/h5/public/get-member-by-carno', {
		util.getDataFromServer('consumer/order/common/get-member-by-carno', {
			carNo,
			vehColor
		}, () => {
			util.showToastNoIcon('获取信息失败');
		}, (res) => {
			if (res.code) {
				util.showToastNoIcon(res.message);
			} else {
				let data = res.data;
				if (data.mobilePhone !== app.globalData.mobilePhone) {
					util.showToastNoIcon('暂无有效订单！');
					return;
				}
				if (parseInt(data.flowVersion) === 1 && parseInt(data.auditStatus) !== 2) {
					// 老流程  未审核通过
					util.showToastNoIcon(`${this.data.carNoStr}没有审核通过的订单`);
					return;
				}
				if (parseInt(data.flowVersion) === 2) {
					// 新流程
					if (parseInt(data.status) !== 1) {
						// 未完善资料
						util.showToastNoIcon(`${this.data.carNoStr}没有完善资料`);
						return;
					}
					if (parseInt(data.hwContractStatus) !== 1) {
						// 高速签约状态：0-未签约，1-已签约
						this.selectComponent('#notSigningPrompt').show();
						return;
					}
					if (parseInt(data.auditStatus) !== 2) {
						// 未审核通过
						util.showToastNoIcon(`${this.data.carNoStr}没有审核通过的订单`);
						return;
					}
				}
				app.globalData.orderInfo.orderId = data.orderId;
				this.setData({
					signed: +(data.contractStatus === 1) || data.etcContractId === -1,
					channel: data.channel
				});
				// 设置渠道名称
				this.setChannelName();
				// 显示弹窗
				if (!this.data.signed) {
					this.setData({sysPlatform: data.sysPlatform});
					this.selectComponent('#noticeDialog').show({
						orderId: data.orderId,
						alertType: 100,
						btnName: '立即签约',
						popUpType: 2,
						sysPlatform: data.sysPlatform,
						title: '车主服务签约提醒',
						text: '您还未完成车主服务签约，请先完成后再激活'
					});
					return;
				}
				wx.setStorageSync('sysPlatform', data.sysPlatform);
				if (/^1\d{10}$/.test(data.mobilePhone) && data.orderId && data.channel) {
					// 青海
					if (data.channel === 4) {
						this.setData({
							qtLimit: JSON.stringify(data.qtLimit)
						});
					}
					// 服务商id
					app.globalData.serverInfoId = data.serverId;
					this.setData({
						serverId: data.serverId,
						mobilePhone: data.mobilePhone,
						showPhone: data.mobilePhone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2')
					});
					if (data.contractStatus !== 1) return;
					// 缓存数据
					wx.setStorageSync('baseInfo', {
						orderId: app.globalData.orderInfo.orderId,
						mobilePhone: this.data.mobilePhone,
						channel: this.data.channel,
						serverId: this.data.serverId,
						qtLimit: this.data.qtLimit,
						carNoStr: this.data.carNoStr,
						obuStatus: data.obuStatus
					});
					switch (this.data.channel) {
						case 1:// 贵州 黔通卡
						case 21:
							util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=2`);
							break;
						case 2:// 内蒙 蒙通卡
							if (!this.data.choiceEquipment) {
								this.setData({
									choiceEquipment: this.selectComponent('#choiceEquipment')
								});
							}
							this.data.choiceEquipment.switchDisplay(true);
							break;
						case 3:	// 山东 鲁通卡
						case 9:	// 山东 齐鲁通卡
							util.go(`/pages/empty_hair/instructions_ujds/index?auditStatus=2`);
							break;
						case 4:	// 青海 青通卡
						case 5:// 天津 速通卡
						case 10:// 湖南 湘通卡
							util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${this.data.channel}`);
							break;
						case 8:	// 辽宁 辽通卡
							util.go(`/pages/empty_hair/instructions_lnnk/index?auditStatus=2`);
							break;
					}
				} else {
					util.showToastNoIcon('未查询到有效订单，请检查！');
				}
			}
		}, app.globalData.userInfo.accessToken,() => {
			wx.hideLoading();
		});
	},
	winShow () {
		this.setData({
			alertFirstShow: 1,
			code: '',
			alertMask: true,
			alertWrapper: true
		});
	},
	// 设置渠道名称
	setChannelName () {
		let channel = this.data.channel;
		let channelName = util.channelNameMap[channel] || '';
		this.setData({channelName});
	},
	// 去签约
	toSign () {
		let data = this.data.sysPlatform;
		if (!data) return util.showToastNoIcon('无签约数据');
		const path = `pages/personal_center/my_etc_detail/my_etc_detail?orderId=${app.globalData.orderInfo.orderId}`;
		this.winHide();
		if (data.appId !== 'wx8a6f6da0e47175da') {
			let params = {
				appId: data.appId,
				path: path,
				extraData: {},
				envVersion: 'release',
				fail: () => {
					util.showToastNoIcon('打开激活小程序失败');
				}
			};
			wx.uma.trackEvent('index_contracted_vehicle_owner_service');
			// TEST CODE
			console.log('跳转目标签约小程序: ', params);
			wx.navigateToMiniProgram(params);
		} else {
			util.go(path);
		}
	},
	/**
	 * 切换车牌颜色
	 * @param event
	 */
	changePlateColor (event) {
		// 颜色不可选
		let color = +event.currentTarget.dataset['color'];
		if (color === 2) return;
		if (this.data.carNo[0] === '粤' && this.data.carNo[1] === 'Z' && (this.data.carNo[6] === '澳' || this.data.carNo[6] === '港')) return;
		let len = this.data.carNoStr.length;
		let tips = '';
		switch (color) {
			case 0:	// 蓝色
				if (len === 8) tips = '您输入的车牌为新能源车牌，无法修改为黄色车牌，请检查车牌号';
				if (this.data.carNo[6] === '警' && len === 7) tips = '车牌输入不合法';
				break;
			case 4:	// 渐变绿
				if (len !== 8) tips = '您输入的车牌非新能源车牌，请检查车牌号';
				break;
			case 1:	// 黄色
				if (len === 8) tips = '您输入的车牌为新能源车牌，无法修改为其他车牌颜色，请检查车牌号';
				if (this.data.carNo[6] === '警' && len === 7) tips = '车牌输入不合法';
				break;
			case 3:	// 白色
				if (this.data.carNo[6] !== '警' && len === 7) tips = '车牌输入不合法';
				break;
		}
		if (tips !== '') {
			util.showToastNoIcon(tips);
			return;
		}
		this.setData({vehColor: color});
	},
	// @cyl
	// 是否接受协议
	onClickAgreementHandle () {
		this.setData({
			getAgreement: !this.data.getAgreement
		});
	},
	// 协议内容
	handleAgreement (e) {
		const type = e.currentTarget.dataset.type;
		if (type === '1') {
			util.go('/pages/text_page/self_buy_equipmemnt_agreement/self_buy_equipmemnt_agreement');
		}
		if (type === '2') {
			util.go('/pages/text_page/privacy_agreement/privacy_agreement');
		}
	},
	// 组件 方法
	agreementHandle (val) {
		if (val.detail === 'ok') {
			this.setData({
				getAgreement: true
			});
		}
	}
});
