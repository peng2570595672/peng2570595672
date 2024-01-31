// 文档: https://developers.weixin.qq.com/miniprogram/dev/framework/plugin/functional-pages/request-payment.html
// functional-pages/request-payment.js
exports.beforeRequestPayment = async function (paymentArgs, callback) {
	// 获取小程序插件透传的 paymentArgs 参数
	const orderId = paymentArgs.parameter.orderId;
	const path = paymentArgs.parameter.isTest ? 'https://etctest.cyzl.com/etc2-client' : 'https://etc.cyzl.com';
	wx.login({
		success (data) {
			wx.request({
				url: `${path}/consumer/order/public/third/pledgePay`,
				data: {
					code: data.code,
					orderId: orderId
				},
				method: 'POST',
				success (res) {
					console.log('unified order success, response is:', res);
					if (res.data.code === 0) {
						const payargs = res.data.data.extraData;
						// 第三步：调用回调函数 callback 进行支付
						// 在 callback 中需要返回两个参数： err 和 requestPaymentArgs：
						// err 应为 null （或者一些失败信息）；
						// requestPaymentArgs 将被用于调用 wx.requestPayment，除了 success/fail/complete 不被支持外，
						// 应与 wx.requestPayment 参数相同。
						const error = null;
						const requestPaymentArgs = {
							timeStamp: payargs.timeStamp,
							nonceStr: payargs.nonceStr,
							package: payargs.package,
							signType: payargs.signType,
							paySign: payargs.paySign,
							extraData: { // 用 extraData 传递自定义数据
								timeStamp: payargs.timeStamp
							}
						};
						callback(error, requestPaymentArgs);
					} else {
						callback(res.data);
					}
				},
				fail (err) {
					console.log('调用接口失败', err);
					// callback 第一个参数为错误信息，返回错误信息
					callback(err);
				}
			});
		},
		fail (err) {
			console.log('wx.login 接口调用失败，将无法正常使用开放接口等服务', err);
			// callback 第一个参数为错误信息，返回错误信息
			callback(err);
		}
	});
};
