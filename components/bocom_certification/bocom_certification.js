const app = getApp();
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		choiceBankObj: {
			type: Object,
			value: {}
		},
		rechargeAmount: {
			type: String,
			value: ''
		},
		identifyingCode: {
			type: String,
			value: ''
		},
		isGetIdentifyingCoding: {
			type: Boolean,
			value: false
		}
	},
	data: {
		mask: false,
		wrapper: false,
		verifyCode: ''
	},
	methods: {
		ok (e) {
			this.hide(e,true);
		},
		show () {
			this.setData({
				mask: true,
				wrapper: true
			});
		},
		hide (e,flag) {
			this.setData({
				wrapper: false,
				canvasIdTmp: this.data.canvasId + this.data.draws,
				draws: this.data.draws + 1
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
			}, 400);
			// console.log('关闭了弹窗');
			this.triggerEvent('onHandle');
		},
		// 输入框输入值
		onInputChangedHandle (e) {
			let verifyCode = e.detail.value;
			this.setData({
				verifyCode
			});
		},
		onSendVerifyCode () {
			this.triggerEvent('sendVerifyCode');
		},
		onSubmit () {
			this.triggerEvent('bcmPayTransfer', {
				verifyCode: this.data.verifyCode
			});
		}
	}
});
