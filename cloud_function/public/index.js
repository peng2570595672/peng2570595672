// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init(
	{
		env: cloud.DYNAMIC_CURRENT_ENV // 使用默认环境,默认可注释
	}
);

// 云函数入口函数
exports.main = async (event, context) => {
	console.log(event);
	const wxContext = cloud.getWXContext();
	switch (event.action) {
		case 'getUrlScheme': {
			return getUrlScheme(event.options);
		}
		case 'sendSms': {
			return sendSms(event.options);
		}
	}
	return 'action not found';
};
// 获取打开小程序微信协议地址
async function getUrlScheme (options) {
	return cloud.openapi.urlscheme.generate({
		jumpWxa: { // 跳转到的目标小程序信息
			path: options && options.path ? options.path : '',// 通过scheme码进入的小程序页面路径，必须是已经发布的小程序存在的页面，path为空时会跳转小程序主页。
			query: options && options.query ? options.query : '' // 通过scheme码进入小程序时的query，最大32个字符，只支持数字，大小写英文以及部分特殊字符：!#$&'()*+,/:;=?@-._~
			// path: 'pages/personal_center/my_etc/my_etc',
			// query: 'abc=123'
		},
		// 如果想不过期则置为 false，并可以存到数据库
		isExpire: true,// 生成的scheme码类型，到期失效：true，永久有效：false。
		// 一分钟有效期
		expireTime: parseInt(Date.now() / 1000 + 60) // 到期失效的scheme码的失效时间，为Unix时间戳。生成的到期失效scheme码在该时间前有效。生成到期失效的scheme时必填。
	});
}

// 获取打开小程序微信协议地址
async function sendSms (options) {
	return cloud.openapi.cloudbase.sendSms(
		{
			env: options.env,// 环境 ID
			content: options.content, // 自定义短信内容，最长支持 60 个字节
			path: options.path, // 云开发静态网站 path，不需要指定域名，例如/index.html
			phoneNumberList: options.phoneNumberList // 手机号列表，单次请求最多支持 1000 个境内手机号，手机号必须以+86开头
		}
	// 	{
	// 		env: 'etc-plus-wxcloud-4k0qq',
	// 		content: '发布了新的能力-qqqq',
	// 		path: '/etc_plus_wxcloud/index.html?sign=9a8c1426459dfd663868d0852e7493b3&t=1609987460',
	// 		phoneNumberList: [
	// 			'+8618224621104'
	// 		]
	// 	}
	);
}
