/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		showChoiceBank: true,
		choiceBank: undefined, // 选择支付方式
		choiceObj: undefined
	},
	onLoad () {
		this.setData({
			choiceBank: this.selectComponent('#choiceBank')
		});
	},
	// 选择银行
	choiceBank () {
		this.data.choiceBank.switchDisplay(true);
	},
	// 拦截点击非透明层空白处事件
	onClickTranslucentHandle() {
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
