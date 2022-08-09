/**
 * @cyl
 *  */
 
let app = getApp();
// 获取openid函数，支持传入回调函数
function getUserInfo(callback) {
	console.log("nihao");
	wx.checkSession({
		success: function(res) {
			// 这里把加密后的openid存入缓存，下次就不必再去发起请求
			const openId = wx.getStorageSync('user_code');
			if (openId) {
				app.globalData.openId = openId;
				callback(0, openId); // 回调函数接受两个参数，第一个代表code种类，0为openId，1为code
			} else {
				// 如果缓存中没有，则需要再次调用登录接口获取code
				wx.login({
					success: function(res) {
						app.globalData.code = res.code;
						callback(1, res.code);
					}
				})
			}
		},
		fail: function(res) {
			wx.login({
				success: function(res) {
					app.globalData.code = res.code;
					callback(1, res.code);
				}
			})
		}
	})
};
// 上传图片 并返回url 地址
function uploadFile_1() {
  wx.chooseImage({
    success (res) {
      console.log(res.tempFilePaths)
      const tempFilePaths = res.tempFilePaths
      wx.uploadFile({
        url: 'https://file.cyzl.com/file/upload', //仅为示例，非真实的接口地址
        filePath: tempFilePaths[0],
        name: 'file',
        success (res){
          const data = JSON.parse(res.data)
          console.log(data.data[0].fileUrl)
        }
      })
    }
  })
}


module.exports = {
	getUserInfo,
	uploadFile_1
}
