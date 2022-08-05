// 获取画布图像
function getCanvasImage(canvasId, imagePath, imageW, imageH, getImgsuccess) {
	const ctx = wx.createCanvasContext(canvasId);
	ctx.drawImage(imagePath, 0, 0, imageW, imageH);
	ctx.draw(true, () => {
		wx.canvasToTempFilePath({
			canvasId: canvasId,
			x: 0,
			y: 0,
			width: imageW,
			height: imageH,
			destWidth: imageW,
			destHeight: imageH,
			quality: 1,
			fileType: 'jpg',
			success(res) {
				getImgsuccess(res.tempFilePath);
			},
			fail(res) {
				// 直接将未处理图片返回
				getImgsuccess();
			}
		});
	});
}
// 处理图片
function  processingPictures (self, path, canvasId, width ,success) {
	let selftWidth = width || 640;
	wx.getImageInfo({
		src: path,
		success: (res) => {
			if (res.width > selftWidth) {
				let width = res.width;
				let height = res.height;
				// 设备宽度为640 高度等比计算
				let targetWidth = selftWidth;
				let targetHeight = targetWidth * height / width;
				self.setData({
					pictureWidth: targetWidth,
					pictureHeight: targetHeight
				});
				console.log(2);
				console.log(res);
				wx.nextTick(() => {
					getCanvasImage(canvasId, path,targetWidth, targetHeight, (res) => {
						if (res) {
							wx.getImageInfo({
								src: res,
								success: (r) => {
									let width = r.width;
									let height = r.height;
									// 计算原始宽高比和压缩后的宽高比 如果一直 则通过 否则压缩视为无效
									if (Math.abs(parseInt(targetWidth) / parseInt(targetHeight) - parseInt(width) / parseInt(height)) < 5) {
										success(res)
										console.log(55555555555);
									} else {
										console.log(444444444444444);
										success();
									}
								},
								fail: () => {
									console.log(33333333333);
									success();
								}
							});
						} else {
							console.log(6666666666);
							success();
						}
					});
				});
			} else {
				success();
			}
		},
		fail: () => {
			success();
		}
	})
}


module.exports = {
	processingPictures
};
