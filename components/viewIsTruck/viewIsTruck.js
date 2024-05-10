const util = require('../../utils/util.js');
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		viewTc: {
			type: Object,
			value: {}
		}
	},

	data: {
		mask: false,
		wrapper: false,
		isShow: false
	},
	methods: {
		generateValidLuhnChecksum (length) {
			let sum = 0;
			let double = false;
			let number = '';

			for (let i = 1; i <= length - 2; i++) {
				number += Math.floor(Math.random() * 10).toString();

				if (double) {
					let digit = parseInt(number.charAt(i - 1));
					digit *= 2;
					if (digit > 9) {
						digit -= 9;
					}
					sum += digit;
				} else {
					sum += parseInt(number.charAt(i - 1));
				}

				double = !double;
			}

			const checkDigit = 10 - (sum % 10);
			return `${number}${checkDigit}`;
		},
		ok (e) {
			this.hide(e, true);
		},
		show () {
			// 调用你的luhmCheck函数
			console.log('19位银行卡号校验结果',util.luhmCheck('6228481198890115877'));
			// console.log(`19位银行卡号校验结果: ${util.luhmCheck('6228481198890115877')}`);
			let height = wx.getSystemInfoSync().screenHeight / wx.getSystemInfoSync().screenWidth;
			console.log();
			this.setData({
				mask: true,
				wrapper: true,
				isShow: (750 * height.toFixed(3)) < 1500 ? true : false
			});
		},
		hide (e) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('onHandle');
			}, 400);
		},
		chooseAxleNum (e) {
			let Num = +e.currentTarget.dataset.value;
			this.triggerEvent('getAxleNum', Num);
			this.hide(e);
		},
		btnMovingIntegral (e) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('btnMovingIntegral', e);
			}, 400);
		}
	}
});
