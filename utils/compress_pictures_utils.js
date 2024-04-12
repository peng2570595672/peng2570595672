/**
 * 获取画布图像
 * @param {string} canvasId 画布的ID
 * @param {string} imagePath 图像的路径
 * @param {number} imageW 图像的宽度
 * @param {number} imageH 图像的高度
 * @param {function} getImgsuccess 获取图像成功时的回调函数，参数为临时文件路径
 */
function getCanvasImage(canvasId, imagePath, imageW, imageH, getImgsuccess) {
	// 创建指定ID的画布上下文
	const ctx = wx.createCanvasContext(canvasId);
	// 在画布上绘制图像
	ctx.drawImage(imagePath, 0, 0, imageW, imageH);
	// 请求绘制画布，并在绘制完成后执行回调
	ctx.draw(true, () => {
		// 将画布转换为临时文件路径
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
				// 转换成功，调用回调函数并传入临时文件路径
				getImgsuccess(res.tempFilePath);
			},
			fail(res) {
				// 转换失败，直接调用回调函数而不传入任何参数
				getImgsuccess();
			}
		});
	});
}
/**
 * 处理图片，将其缩放到指定宽度，并保持比例，如果图片原宽度大于指定宽度。
 * @param {Object} self - 上下文对象，通常为this。
 * @param {string} path - 图片的路径或URL。
 * @param {string} canvasId - 用于绘制图片的canvas元素的ID。
 * @param {number} width - 指定图片的最大宽度，默认为640。
 * @param {Function} success - 处理完成后的回调函数，如果图片成功处理，将携带处理后的图片信息作为参数调用。
 */

function processingPictures (self, path, canvasId, width ,success) {
	let selftWidth = width || 640; // 如果未指定宽度，则默认为640
	wx.getImageInfo({
		src: path,
		success: (res) => {
			if (res.width > selftWidth) {
				let width = res.width;
				let height = res.height;
				// 根据目标宽度计算等比例目标高度
				let targetWidth = selftWidth;
				let targetHeight = targetWidth * height / width;
				// 更新数据，用于在页面上显示图片的缩放尺寸
				self.setData({
					pictureWidth: targetWidth,
					pictureHeight: targetHeight
				});
				// 使用canvas绘制缩放后的图片，并尝试获取绘制后的图片信息
				wx.nextTick(() => {
					getCanvasImage(canvasId, path,targetWidth, targetHeight, (res) => {
						if (res) {
							// 检查压缩后的图片尺寸是否符合预期的比例
							wx.getImageInfo({
								src: res,
								success: (r) => {
									let width = r.width;
									let height = r.height;
									// 如果宽高比接近预期，则调用成功回调，否则视为压缩失败
									if (Math.abs(parseInt(targetWidth) / parseInt(targetHeight) - parseInt(width) / parseInt(height)) < 5) {
										success(res);
									} else {
										success();
									}
								},
								fail: () => {
									success();
								}
							});
						} else {
							success();
						}
					});
				});
			} else {
				// 如果图片原宽度不大于指定宽度，则直接调用成功回调
				success();
			}
		},
		fail: () => {
			// 获取图片信息失败时，调用成功回调
			success();
		}
	})
}


module.exports = {
	processingPictures
};
