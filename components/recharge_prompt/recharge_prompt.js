const app = getApp();
Component({
	properties: {
		info: {
			type: Object,
			value: {}
		}
	},
	data: {
		mask: false,
		wrapper: false
	},
	methods: {
		ok (e) {
			this.hide(e,true);
		},
		// 复制银行卡号
		onClickCopyBankCardNumber (e) {
			let bankCardNumber = e.currentTarget.dataset['no'];
			wx.setClipboardData({
				data: bankCardNumber,
				success (res) {
					wx.getClipboardData({
						success (res) {
							console.log(res.data); // data 剪贴板的内容
						}
					});
				}
			});
		},
		show () {
			this.setData({
				mask: true,
				wrapper: true
			});
		},
		hide (e,flag) {
			console.log(
				'hide'
			);
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
			}, 400);
		}
	}
});
