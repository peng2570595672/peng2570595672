import drawQrcode from '../../utils/qrcode.js';
const app = getApp();
const util = require('../../utils/util.js');
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		qrType: { // 0 url地址（需生成二维码） 1 图片地址
			type: 0,
			value: 0
		},
		qrUrl: {
			type: String,
			value: ''
		},
		title: {
			type: String,
			value: ''
		},
		note: {
			type: String,
			value: ''
		},
		btnTitle: {
			type: String,
			value: '确定'
		}
	},
	data: {
		mask: false,
		wrapper: false,
		imgUrl: '',
		canvasId: 'canvas',
		canvasIdTmp: 'canvas2',
		draws: 2,
		thisObj: this
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
			util.showLoading({
				title: '正在生成二维码'
			});
			setTimeout(() => {
				this.draw();
				util.hideLoading();
			},500);
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
		draw () {
			const $this = this;
			let width = 230 / 750 * wx.getSystemInfoSync().windowWidth;
			drawQrcode({
				width: width,
				height: width,
				canvasId: this.data.canvasIdTmp,
				text: this.data.qrUrl,
				_this: $this
			});
		}
	}
});
