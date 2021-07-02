export function initProductName (orderInfo) {
	if (orderInfo.flowVersion === 4) return 'ETC货车账户'
	if (orderInfo.productProcess === 1) return '微信支付'
	return orderInfo.productName || '';
}
