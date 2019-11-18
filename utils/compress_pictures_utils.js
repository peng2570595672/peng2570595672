function getCanvasImage(canvasId, imagePath, imageW, imageH, getImgsuccess) {
	const ctx = wx.createCanvasContext(canvasId);
	ctx.drawImage(imagePath, 0, 0, imageW, imageH);
	ctx.draw(false, () => {
		wx.canvasToTempFilePath({
			canvasId: canvasId,
			x: 0,
			y: 0,
			width: imageW,
			height: imageH,
			quality: .95,
			fileType: 'jpg',
			success(res) {
				getImgsuccess(res.tempFilePath);
			}
		});
	});
}
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
				wx.nextTick(() => {
					getCanvasImage(canvasId, path,targetWidth, targetHeight, (res) => {
						success(res)
					})
				});
			} else {
				success();
			}
		}
	})
}


module.exports = {
	processingPictures
};
