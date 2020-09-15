const app = getApp();
Page({
	data: {
		bgImgPath: '/pages/personal_center/assets/public_account.png',//封面大图
		xcxcode:"https://file.cyzl.com/g001/M01/3D/CD/oYYBAF1mKcaAH5_TAAAORNEbz5k352.png",//二维码
		price:'159',//价格
		title:'nazze 日系工装飞行员冬季夹克男',//标题
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		var that = this;
		that.setData({
			// nickName: app.globalData.userInfo.nickName,
			// avatarUrl: app.globalData.userInfo.avatarUrl
			nickName: '乐生',
			avatarUrl: 'https://file.cyzl.com/g001/M00/3D/CE/oYYBAF1mK-CAer-wAAAUESpv0Uo239.png'//这是你的头像地址
		})
		//1. 请求后端API生成小程序码
		//that.getQr();
		//2. canvas绘制文字和图片
		const ctx = wx.createCanvasContext('myCanvas');
		// var imgPath = 'https://file.cyzl.com/g001/M00/3D/CE/oYYBAF1mK-CAer-wAAAUESpv0Uo239.png';//黄色边框
		var avatarUrl = that.data.avatarUrl;//头像
		var nickName = that.data.nickName;//昵称
		var bgImgPath = that.data.bgImgPath;//封面大图
		var basicprofile = 'https://file.cyzl.com/g001/M05/04/00/oYYBAF4CzrCAKK9zAACuVWoDsXo412.png';//指纹图片
		var xcxcode = that.data.xcxcode;//二维码
		var price = that.data.price;//价格
		var title=that.data.title;//标题
		//填充背景（图片的白色背景）
		ctx.setFillStyle('#ffffff');
		ctx.fillRect(0, 0, 375, 596);//坐标和宽高
		// 第一张图片（黄色边框）
		// ctx.drawImage(imgPath, 18, 26, 340, 544);
		// 第二张图片（头像）
		ctx.drawImage(avatarUrl, 158, 47, 60, 60);
		//绘制昵称
		ctx.setFontSize(15);
		ctx.setFillStyle('#000000');
		ctx.fillText(nickName, 173, 127);
		//绘制标题
		ctx.setFontSize(18);
		ctx.setFillStyle('#000000');
		ctx.fillText('发起了一个折扣详情', 107, 163);
		// 第三张图片（封面大图）
		ctx.drawImage(bgImgPath, 38, 185, 300, 162);
		//绘制符号￥
		ctx.setFontSize(15);
		ctx.setFillStyle('#DDB039');
		ctx.fillText('￥', 160, 379);
		//绘制价格
		ctx.setFontSize(26);
		ctx.setFillStyle('#DDB039');
		ctx.fillText(price, 174, 381);
		//绘制标题
		ctx.setFontSize(15);
		ctx.setFillStyle('#000');
		ctx.fillText(title, 57, 410);

		//绘制一条虚线

		// ctx.strokeStyle = 'blue';
		// ctx.beginPath();
		// ctx.setLineWidth(1);
		// ctx.setLineDash([2, 4]);
		// ctx.moveTo(10, 287);
		// ctx.lineTo(230, 287);
		// ctx.stroke();

		//绘制指纹图标
		ctx.drawImage(basicprofile, 76, 438, 67, 66);
		ctx.setFontSize(11);
		ctx.setFillStyle('#000');
		ctx.fillText('长按识别小程序码', 66, 526);

		//绘制二维码
		ctx.drawImage(xcxcode, 218, 426, 102, 102);

		ctx.draw();

	},
	savetup: function () {
		var that = this;
		wx.canvasToTempFilePath({
			x: 0,
			y: 0,
			width: 375,
			height: 596,
			destWidth: 375,
			destHeight: 596,
			canvasId: 'myCanvas',
			success: function (res) {
				//调取小程序当中获取图片
				console.log(res.tempFilePath);
				wx.saveImageToPhotosAlbum({
					filePath: res.tempFilePath,
					success(res) {
						wx.showModal({
							title: '图片保存成功！',
							content: '请将图片分享到朋友圈',
							showCancel: false,
							confirmText: '知道了',
							confirmColor: '#72B9C3',
							success: function (res) {
								if (res.confirm) {
									console.log('用户点击确定');
								}
							}
						})
					}
				})
			},
			fail: function (res) {
				console.log(res)
			}
		})
	},
})
