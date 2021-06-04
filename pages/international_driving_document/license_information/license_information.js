const util = require('../../../utils/util.js');
const city = require('../../../utils/citys.js');
Page({
	data: {
		stepArr: [
			{
				selected: true
			},
			{
				selected: true
			},
			{
				selected: false
			}
		], // 步骤导航
		drivingLicenseFace: {
		}, // 行驶证正面
		sexIndex: 0,
		sexTypeArr: ['请选择性别','男','女'],
		validityDateType: 0, // 选择框当前选中索引
		validityDateArr: ['请选择有效年份','6年', '10年', '20年'],
		licenseTypeIndex: 0,
		licenseTypeArr: ['请选择准驾车型','A1', 'A2', 'A3','B1','B2','C1','C2'], // 准驾车型
		available: false, // 按钮是否可点击
		showSampleWrapper: false,
		isHaveCity: false,
		regionCity: ['省', '市'],
		multiIndex: [0, 0],
		multiArray: city.multiArray,// 引入city.js中定义的数组
		objectMultiArray: city.objectMultiArray
	},
	onLoad () {
		let path = wx.getStorageSync('international-car');
		if (path) {
			wx.removeStorageSync('international-car');
			this.uploadOcrFile(path);
			return false;
		}
		let drivingLicenseFace = wx.getStorageSync('international-driving-license-face');
		if (drivingLicenseFace) {
			drivingLicenseFace = JSON.parse(drivingLicenseFace);
			let licenseTypeIndex;
			if (drivingLicenseFace.type) {
				this.data.licenseTypeArr.forEach((item,i) => {
					if (item === drivingLicenseFace.type) {
						licenseTypeIndex = i;
						return false;
					}
				});
			}
			this.setData({
				drivingLicenseFace: drivingLicenseFace,
				sexIndex: drivingLicenseFace.gender,
				licenseTypeIndex: licenseTypeIndex
			});
			this.setData({
				available: this.validateData(false)
			});
		}
	},
	// 上传图片
	uploadOcrFile (path) {
		// 上传并识别图片
		util.showLoading('加载中');
		util.uploadOcrFile(path, 5, () => {
			util.showToastNoIcon('文件服务器异常！');
		}, (res) => {
			util.hideLoading();
			if (res) {
				res = JSON.parse(res);
				console.log(res);
				if (res.code === 0) { // 识别成功
					const faceObj = res.data[0].ocrObject;
					if (!faceObj.number) {
						util.showToastNoIcon('识别失败！');
						return;
					}
					faceObj.fileUrl = res.data[0].fileUrl;
					let licenseTypeIndex;
					if (faceObj.type) {
						this.data.licenseTypeArr.forEach((item,i) => {
							if (item === faceObj.type) {
								licenseTypeIndex = i;
								return false;
							}
						});
					}
					this.setData({
						drivingLicenseFace: faceObj,
						sexIndex: faceObj.sex === '男' ? 1 : faceObj.sex === '女' ? 2 : 0,
						licenseTypeIndex: licenseTypeIndex
					});
					faceObj.gender = this.data.sexIndex;
					wx.setStorageSync('international-driving-license-face', JSON.stringify(faceObj));
				} else { // 识别失败
					util.showToastNoIcon('识别失败');
				}
			} else { // 识别失败
				util.hideLoading();
				util.showToastNoIcon('识别失败');
			}
		}, () => {
		});
	},
	// 输入项值变化
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let value = e.detail.value.trim();
		if (key === 'firstName' || key === 'lastName') {
			value = value.toUpperCase();
		}
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace[key] = value;
		this.setData({
			drivingLicenseFace
		});
		this.setData({
			available: this.validateData(false)
		});
	},
	// 日期
	datePickerChange (e) {
		let key = e.currentTarget.dataset.key;
		let value = e.detail.value.trim();
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace[key] = value;
		this.setData({
			drivingLicenseFace
		});
		this.setData({
			available: this.validateData()
		});
	},
	// 有效年份
	validityDatePickerChange (e) {
		this.setData({
			validityDateType: parseInt(e.detail.value)
		});
		let drivingLicenseFace = this.data.drivingLicenseFace;
		let validityDate = this.data.validityDateArr[this.data.validityDateType];
		drivingLicenseFace.validityDate = validityDate.replace('年','');
		this.setData({
			drivingLicenseFace
		});
		this.setData({
			available: this.validateData()
		});
	},
	// 性别
	sexTypePickerChange (e) {
		this.setData({
			sexIndex: parseInt(e.detail.value)
		});
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace.sexType = this.data.sexIndex;
		this.setData({
			drivingLicenseFace
		});
		this.setData({
			available: this.validateData()
		});
	},
	// 准驾车型
	licenseTypePickerChange (e) {
		this.setData({
			licenseTypeIndex: parseInt(e.detail.value)
		});
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace.type = this.data.licenseTypeArr[this.data.licenseTypeIndex];
		this.setData({
			drivingLicenseFace
		});
		this.setData({
			available: this.validateData()
		});
	},
	onPickerCityChangedHandle: function (e) {
		this.setData({
			isHaveCity: true,
			'multiIndex[0]': e.detail.value[0],
			'multiIndex[1]': e.detail.value[1]
		});
		this.data.drivingLicenseFace.issueProvince = this.data.multiArray[0][e.detail.value[0]];
		this.data.drivingLicenseFace.issueCity = this.data.multiArray[1][e.detail.value[1]];
		this.setData({
			available: this.validateData()
		});
	},
	bindMultiPickerColumnChange: function (e) {
		switch (e.detail.column) {
			case 0:
				let list = [];
				for (var i = 0; i < this.data.objectMultiArray.length; i++) {
					if (this.data.objectMultiArray[i].parid === this.data.objectMultiArray[e.detail.value].regid) {
						list.push(this.data.objectMultiArray[i].regname);
					}
				}
				this.setData({
					'multiArray[1]': list,
					'multiIndex[0]': e.detail.value,
					'multiIndex[1]': 0
				});
		}
	},
	// 校验数据
	validateData (isToast) {
		if (!this.data.drivingLicenseFace.number) {
			if (isToast) util.showToastNoIcon('驾照号不能为空！');
			return false;
		}
		if (!/^[a-zA-Z0-9]{6,18}$/.test(this.data.drivingLicenseFace.number)) {
			if (isToast) util.showToastNoIcon('驾照号格式不正确！');
			return false;
		}
		if (!this.data.drivingLicenseFace.address) {
			if (isToast) util.showToastNoIcon('街道不能为空！');
			return false;
		}
		if (!/^[a-zA-Z0-9\u4e00-\u9fa5]{3,}$/.test(this.data.drivingLicenseFace.address)) {
			if (isToast) util.showToastNoIcon('街道格式不正确！');
			return false;
		}
		if (!this.data.drivingLicenseFace.name) {
			if (isToast) util.showToastNoIcon('姓名不能为空！');
			return false;
		}
		if (!/^[\u0391-\uFFE5]+$/.test(this.data.drivingLicenseFace.name)) {
			if (isToast) util.showToastNoIcon('姓名格式不正确！');
			return false;
		}
		if (!/^[a-zA-Z]+$/.test(this.data.drivingLicenseFace.firstName)) {
			if (isToast) util.showToastNoIcon('姓名拼音格式不正确！');
			return false;
		}
		if (!/^[a-zA-Z]+$/.test(this.data.drivingLicenseFace.lastName)) {
			if (isToast) util.showToastNoIcon('姓名拼音格式不正确！');
			return false;
		}
		if (this.data.sexIndex === 0) {
			if (isToast) util.showToastNoIcon('请选择性别！');
			return false;
		}
		if (!this.data.drivingLicenseFace.birth) {
			if (isToast) util.showToastNoIcon('请选择出生日期！');
			return false;
		}
		if (!this.data.drivingLicenseFace.firstIssue) {
			if (isToast) util.showToastNoIcon('请选择初次领证日期！');
			return false;
		}
		if (!this.data.drivingLicenseFace.validDateBegin) {
			if (isToast) util.showToastNoIcon('请选择有效起始日期！');
			return false;
		}
		if (this.data.licenseTypeIndex === 0) {
			if (isToast) util.showToastNoIcon('准驾车型不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseFace.validDateEnd) {
			if (isToast) util.showToastNoIcon('请选择初次有效期限！');
			return false;
		}
		if (new Date(this.data.drivingLicenseFace.validDateEnd) < new Date(this.data.drivingLicenseFace.validDateBegin)) {
			if (isToast) util.showToastNoIcon('有效期限不能小于有效起始日期！');
			return false;
		}
		if (!this.data.validityDateType === 0) {
			if (isToast) util.showToastNoIcon('请选择有效年份！');
			return false;
		}
		if (!this.data.isHaveCity) {
			if (isToast) util.showToastNoIcon('请选择发证地！');
			return false;
		}
		return true;
	},
	// 下一步
	async next () {
		if (!this.validateData(true)) return false;
		wx.uma.trackEvent('IDL_for_license_information_to_next');
		this.data.drivingLicenseFace.gender = this.data.sexIndex;
		wx.setStorageSync('international-driving-license-face', JSON.stringify(this.data.drivingLicenseFace));
		this.setData({
			available: this.validateData(true)
		});
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		let drivingLicenseFace = this.data.drivingLicenseFace;
		let params = {
			drivingUrl: drivingLicenseFace.fileUrl,
			drivingLicence: drivingLicenseFace.number,
			translateAddress: drivingLicenseFace.address,
			drivingType: drivingLicenseFace.type, // 驾照类型，包含A1，A2，A3，B1，B2，C1，C2,
			driverName: drivingLicenseFace.name,
			firstName: drivingLicenseFace.firstName, // 驾照用户姓拼音,
			lastName: drivingLicenseFace.lastName, // 驾照用户名拼音
			gender: drivingLicenseFace.gender, // 性别 1男 2 女
			birthdate: drivingLicenseFace.birth,
			accreditationDate: drivingLicenseFace.firstIssue,// 初次领证日期
			issuingDate: drivingLicenseFace.validDateBegin,// 有效起始日期
			endDate: drivingLicenseFace.validDateEnd, // 有效期限
			effectiveDate: drivingLicenseFace.validityDate, // 有效年限，包含6、10、20
			issueProvince: drivingLicenseFace.issueProvince,// issueProvince
			issueCity: drivingLicenseFace.issueCity
		};
		const result = await util.getDataFromServersV2('consumer/order/iso_driving/licenceInfoSave', params);
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
			wx.removeStorageSync('international-driving-license-face');
			let orderInfo = {};
			orderInfo.id = result.data.id;
			orderInfo.dataStatus = 2;
			orderInfo.payStatus = 0;
			util.go(`/pages/international_driving_document/express_information/express_information?orderInfo=${JSON.stringify(orderInfo)}`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 隐藏弹窗
	onHandle () {
		this.setData({
			isShowTextarea: true
		});
	},
	onClickSample () {
		this.setData({
			showSampleWrapper: true
		});
	},
	// 关闭详情
	close () {},
	hide () {
		this.setData({
			showSampleWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showSampleWrapper: false
			});
		}, 400);
	}
});
