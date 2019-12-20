/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		showChoiceBank: true,
		choiceBank: undefined, // 选择支付方式
		choiceObj: undefined,
		bankCardIdentifyResult: {
			ocrObject: {}
		},// 银行卡识别结果
		idCardFace: {
			ocrObject: {}
		},// 身份证正面
		idCardBack: {
			ocrObject: {}
		}// 身份证反面
	},
	onLoad () {
		this.setData({
			choiceBank: this.selectComponent('#choiceBank')
		});
	},
	onShow () {
		// 银行卡
		let bankCardIdentifyResult = wx.getStorageSync('bank_card_identify_result');
		if (bankCardIdentifyResult) {
			bankCardIdentifyResult = JSON.parse(bankCardIdentifyResult);
			this.setData({
				bankCardIdentifyResult: bankCardIdentifyResult.data[0]
			});
			wx.removeStorageSync('bank_card_identify_result');
		}
		// 身份证正面
		let idCardFace = wx.getStorageSync('id_card_face');
		if (idCardFace) {
			idCardFace = JSON.parse(idCardFace);
			this.setData({
				idCardFace: idCardFace.data[0]
			});
			wx.removeStorageSync('id_card_face');
		}
		// 身份证反面
		let idCardBack = wx.getStorageSync('id_card_back');
		if (idCardBack) {
			idCardBack = JSON.parse(idCardBack);
			this.setData({
				idCardBack: idCardBack.data[0]
			});
			wx.removeStorageSync('id_card_back');
		}
	},
	// 选择银行
	choiceBank () {
		this.data.choiceBank.switchDisplay(true);
	},
	// 拦截点击非透明层空白处事件
	onClickTranslucentHandle () {
		this.data.choiceBank.switchDisplay(false);
	},
	// 具体支付方式
	onClickItemHandle () {
		this.setData({
			choiceObj: {}
		});
		this.data.choiceBank.switchDisplay(false);
	},
	// 拍照 银行卡
	onClickShotBankCardHandle (e) {
		let type = e.currentTarget.dataset.type;
		util.go(`/pages/default/shot_bank_card/shot_bank_card?type=${type}`);
	},
	// 签约
	next () {
		util.go('/pages/default/signed_successfully/signed_successfully');
	}
});
