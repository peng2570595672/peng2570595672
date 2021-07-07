export function initProductName (orderInfo) {
	// productProcess 套餐流程 1-微信 2-绑定银行 3-存量卡 4-三类户 5-信用卡
	if (orderInfo.flowVersion === 4) return 'ETC货车账户'
	if (orderInfo.productProcess === 1) return '微信支付'
	return orderInfo.productName || '';
}
