const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
		orderId: '',
		newOrderInfo: {}, // 原订单数据（身份证、行驶证、车头照）
        formData: { // 基础信息
			currentCarNoColor: 0, // 0 蓝色 1 渐变绿 2黄色
			region: [], // 省市区
			regionCode: [], // 省份编码
			userName: '', // 收货人姓名
			telNumber: '', // 电话号码
			detailInfo: '' // 收货地址详细信息
		}, // 提交数据
        paper: { // 证件信息
            idName: '', // 身份证姓名
            idNum: '', // 身份证号码
            handlePhone: '', // 办理手机号
            licenseInformation: {
				licenseMainPage: '',
				licenseVicePage: ''
			}, // 行驶证信息
            carHeadPhone: '', // 车头照
			code: '', // 验证码
			simImg: ''	// 剪卡图片
        },
        sim: '', // 剪卡
         // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
        carPlateColorList: ['蓝牌','黄牌','黑牌','白牌','渐变绿牌','黄绿双拼牌','蓝白渐变'],
        tip1: '',	// 经办人电话号码校验提示
		tip2: '',	// 收件人姓名校验
		tip3: '',	// 校验收件人电话号码提示
		tip4: '', 	// 办理手机号校验提示
		isName: true,	// 控制收货人名称是否合格
		size: 30,
        available: false,	// 控制底部悬浮按钮的颜色变化
        pictureWidth: 0, // 压缩图片
		pictureHeight: 0,
		updatedPhone: true,	// 是否禁止修改办理手机号
		codeCopywriting: '获取验证码',	// 衍生吗按钮文案
		isGetCode: true,	// 是否可获取验证码
		paperIsExpire: false	// false表示证件未过期
    },

    onLoad (options) {
        if (options?.orderId) this.setData({orderId: options.orderId});
    },
    onShow () {
		this.queryOrder(this.data.orderId);
    },
    // 根据订单ID查询订单信息
    async queryOrder (orderId) {
        const result = await util.getDataFromServersV2('consumer/order/order-detail-for-update', {
            orderId: orderId
        },'post',false);
        if (!result) return;
        if (result.code === 0) {
            console.log(result.data);
            let res = result.data.orderReceive;
            let info = result.data.memberCardInfo;
            let orderInfo = result.data.orderInfo;
            let formData = this.data.formData;
            formData.userName = res.receiveMan; // 姓名
            formData.telNumber = res.receivePhone; // 电话
            formData.region = [res.receiveProvince, res.receiveCity, res.receiveCounty]; // 省市区
            formData.detailInfo = res.receiveAddress; // 详细地址
            let paper = this.data.paper;
            paper.idName = info.trueName;// 身份证姓名
            paper.idNum = info.idNumber;// 身份证号码
            paper.handlePhone = result.data.orderCardInfo.cardMobilePhone;// 办理手机号
            paper.licenseInformation.licenseMainPage = result.data.orderVehicleInfo?.licenseMainPage;
            paper.licenseInformation.licenseVicePage = result.data.orderVehicleInfo?.licenseVicePage;
            paper.carHeadPhone = result.data.orderHeadstockInfo?.fileUrl;
            this.setData({
                formData,
                paper,
				newOrderInfo: result.data,
				available: this.validateAvailable()
            });
			if (result.data.orderCardInfo.validDate.includes('长期')) return;
			let timeInterval = result.data.orderCardInfo.validDate.split('-');
			if (!util.isDuringDateIdCard(timeInterval[0], timeInterval[1])) {
				this.setData({paperIsExpire: true});
				util.showToastNoIcon('身份证已过期，请重新上传证件');
			};
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 上传剪卡凭证
    uploadPictures () {
        let that = this;
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            maxDuration: 30,
            camera: 'back',
            success (res) {
                if (res.errMsg === 'chooseMedia:ok') {
                    console.log(res);
                    let path = res.tempFiles[0].tempFilePath;
                    compressPicturesUtils.processingPictures(that, path, 'pressCanvas', 640, (res) => {
                        if (res) { // 被处理
                            that.upload(res);
                        } else { // 未被处理
                            that.upload(path);
                        }
                    });
                }
            },
            fail: (res) => {
				if (res.errMsg !== 'chooseImage:fail cancel') {
					util.showToastNoIcon('选择图片失败！');
				}
			}
        });
    },
	// 上传文件
    upload (path) {
        util.uploadFile(path, () => {
            util.showToastNoIcon('文件上传失败');
        }, (res) => {
            if (res) {
                res = JSON.parse(res);
                if (res.code === 0) { // 文件上传成功
					console.log(res);
                    util.showToastNoIcon('文件上传成功');
                    this.setData({
                        sim: '已上传',
						'paper.simImg': res.data[0].fileUrl
                    });
                    this.fangDou('',500);
                } else { // 文件上传失败
                    util.showToastNoIcon(res.message);
                }
            } else { // 文件上传失败
                util.showToastNoIcon('文件上传失败');
            }
        }, () => {});
    },

    // 省市区选择
	onPickerChangedHandle (e) {
		console.log(e);
		let formData = this.data.formData;
		formData.region = e.detail.value;
		if (e.detail.code && e.detail.code.length === 3) {
			formData.regionCode = e.detail.code;
		}
		this.setData({
			formData,
			available: this.validateAvailable(true)
		});
	},

    // 从微信选择地址
	onClickAutoFillHandle () {
		// 统计点击事件
		wx.uma.trackEvent('receiving_select_the_wechat_address');
		wx.chooseAddress({
			success: (res) => {
				console.log(res);
				let formData = this.data.formData;
				formData.userName = res.userName; // 姓名
				formData.telNumber = res.telNumber; // 电话
				formData.region = [res.provinceName, res.cityName, res.countyName]; // 省市区
				formData.detailInfo = res.detailInfo; // 详细地址
				this.setData({
					formData,
					tip2: '',
					tip3: '',
					mobilePhoneIsOk: /^1[0-9]{10}$/.test(res.telNumber.substring(0, 11))
				});
				this.setData({
					available: this.validateAvailable(true)
				});
			},
			fail: (e) => {
				if (e.errMsg === 'chooseAddress:fail auth deny' || e.errMsg === 'chooseAddress:fail authorize no response') {
					util.alert({
						title: '提示',
						content: '由于您拒绝了访问您的收货地址授权，导致无法正常获取收货地址信息，是否重新授权？',
						showCancel: true,
						confirmText: '重新授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (e.errMsg !== 'chooseAddress:fail cancel') {
					util.showToastNoIcon('选择收货地址失败！');
				}
			}
		});
	},
    // 选择当前地址
	onClickChooseLocationHandle () {
		// 统计点击事件
		wx.uma.trackEvent('receiving_select_the_address');
		wx.chooseLocation({
			success: (res) => {
				let address = res.address;
				let name = res.name;
				if (address) {
					// 根据地理位置信息获取经纬度
					util.getInfoByAddress(address, (res) => {
						let result = res.result;
						if (result) {
							let location = result.location;
							name = result.title + name;
							// 根据经纬度信息 反查详细地址信息
							this.getAddressInfo(location, name);
							this.setData({
								available: this.validateAvailable(true)
							});
						}
					}, () => {
						util.showToastNoIcon('获取地理位置信息失败！');
					});
				}
			},
			fail: (e) => {
				// 选择地址未允许授权
				if (e.errMsg === 'chooseLocation:fail auth deny' || e.errMsg === 'getLocation:fail authorize no response') {
					util.alert({
						title: '提示',
						content: '由于您拒绝了获取您的地理位置授权，导致无法正常获取地理位置信息，是否重新授权？',
						showCancel: true,
						confirmText: '重新授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (e.errMsg !== 'chooseLocation:fail cancel') {
					util.showToastNoIcon('获取地理位置信息失败！');
				}
			}
		});
	},
	//  根据经纬度信息查地址
	getAddressInfo (location, name) {
		util.getAddressInfo(location.lat, location.lng, (res) => {
			if (res.result) {
				let info = res.result.ad_info;
				let formData = this.data.formData;
				formData.region = [info.province, info.city, info.district]; // 省市区
				formData.regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode]; // 省市区区域编码
				formData.detailInfo = name; // 详细地址
				this.setData({
					formData
				});
				// 校验数据
				this.setData({
					available: this.validateAvailable()
				});
			} else {
				util.showToastNoIcon('获取地理位置信息失败！');
			}
		}, () => {
			util.showToastNoIcon('获取地理位置信息失败！');
		});
	},
    // 校验字段是否满足
	validateAvailable (checkLicensePlate) {
		// 是否接受协议
		let isOk = true;
		let formData = this.data.formData;
		let paper = this.data.paper;
		// 校验姓名
		isOk = isOk && formData.userName && formData.userName.length >= 1;
		// 校验省市区
		isOk = isOk && formData.region && formData.region.length === 3 && formData.region[0] !== '省';
		// 校验省市区编码
		isOk = isOk && formData.regionCode && formData.region.length === 3;
		// 校验详细地址
		isOk = isOk && formData.detailInfo && formData.detailInfo.length >= 2;
		// 检验手机号码
		isOk = isOk && formData.telNumber && /^1[0-9]{10}$/.test(formData.telNumber);
        // 校验剪卡凭证是否上传
        isOk = isOk && this.data.sim === '已上传';
		// 校验身份证姓名
		isOk = isOk && paper.idName.length > 0;
		// 校验身份证号码
		isOk = isOk && paper.idNum.length > 0;
		// 校验车辆照片
		isOk = isOk && paper.carHeadPhone.length > 0;
		// 校验办理手机号
		isOk = isOk && paper.handlePhone && /^1[0-9]{10}$/.test(paper.handlePhone);
		// 校验验证码
		isOk = isOk && (!this.data.updatedPhone ? paper.code.length > 0 : true);
		// 校验车辆行驶证
		isOk = isOk && paper.licenseInformation.licenseMainPage.length > 0 && paper.licenseInformation.licenseVicePage.length > 0;
		return isOk;
	},
	// 确认前校验
	confirmCheck () {
		let formData = this.data.formData;
		let paper = this.data.paper;
		if (this.data.paperIsExpire) return util.showToastNoIcon('身份证已过期，请重新上传证件');
		if (!this.data.sim) return util.showToastNoIcon('剪卡未上传');
		if (!paper.idName) return util.showToastNoIcon('身份证姓名不能为空');
		if (!paper.idNum) return util.showToastNoIcon('身份证号码不能为空');
		if (!paper.carHeadPhone) return util.showToastNoIcon('车辆照片不能为空');
		if (!paper.handlePhone) return util.showToastNoIcon('办理手机号不能为空');
		if (!this.data.updatedPhone && !paper.code) return util.showToastNoIcon('验证码不能为空');
		if (!paper.licenseInformation.licenseMainPage || !paper.licenseInformation.licenseVicePage) return util.showToastNoIcon('车辆行驶证不能为空');
	},
    // 输入框输入值
	onInputChangedHandle (e) {
		if (e.detail.cursor === 0) this.setData({available: false});
		let key = e.currentTarget.dataset.name;	//
		let len = e.detail.cursor;	// 输入值的长度
		let value = e.detail.value;
		let formData = this.data.formData;
		let paper = this.data.paper;
		let tip1 = '';	// 办理人手机号提示
		let tip2 = '';	// 收货姓名提示
		let tip3 = '';	// 收获人手机号提示
		let tip4 = '';	// 办理手机号提示
		// 手机号 校验
		if (key === 'telNumber' || key === 'operator' || key === 'handlePhone') {
			let value = e.detail.value;
			let flag = /^1[1-9][0-9]{9}$/.test(value);
			if (value.substring(0,1) !== '1' || value.substring(1,2) === '0') {
				if (key === 'telNumber') this.setData({'formData.telNumber': ''});
				if (key === 'operator') this.setData({'formData.operator': ''});
				if (key === 'handlePhone') this.setData({'paper.handlePhone': ''});
				return util.showToastNoIcon('非法号码');
			} else if (len < 11) {
				tip1 = key === 'operator' ? '*手机号未满11位，请检查' : '';
				tip3 = key === 'telNumber' ? '*手机号未满11位，请检查' : '';
				tip4 = key === 'handlePhone' ? '*手机号未满11位，请检查' : '';
			} else if (len === 11 && !flag) {
				tip3 = key === 'telNumber' ? '非法号码' : '';
				tip4 = key === 'handlePhone' ? '非法号码' : '';
				util.showToastNoIcon('非法号码');
			}
		}
		// 收货人姓名 校验
		if (key === 'userName') {
			let patrn = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/im;	// 校验非法字符
			let patrn1 = /^[A-Za-z]+$/;	// 校验英文
			let patrn2 = /^[\u4e00-\u9fa5]{0,}$/;	// 校验汉字
			if (len < 1) {
				tip2 = '姓名不可为空';
			} else if (patrn.test(value)) {
				value = '';
				tip2 = '非法字符';
				util.showToastNoIcon('非法字符');
			} else if (patrn2.test(value)) {
				tip2 = len > 13 ? '超出可输入最大数' : '';
				this.setData({
					size: 13
				});
			} else if (patrn1.test(value)) {
				tip2 = len > 26 ? '超出可输入最大数' : '';
				this.setData({
					size: 26
				});
			} else if (!patrn2.test(value) && !patrn1.test(value)) {
				tip2 = len > 26 ? '超出可输入最大数' : '';
				this.setData({
					size: 26
				});
			}
		}
		formData[key] = value;
		paper[key] = value;
		this.setData({
			formData,
			tip1,
			tip2,
			tip3,
			tip4,
			paper
		});
		this.fangDou('',500);
	},
	// 获取验证码
	async getCode () {
		if (this.data.tip4 > 0 || this.data.paper.handlePhone.length < 11) {
			util.showToastNoIcon('号码有误，无法获取验证码');
			return;
		}
		const result = await util.getDataFromServersV2('consumer/order/send-receive-phone-verification-code', {
			receivePhone: this.data.paper.handlePhone + '' // 手机号
		}, 'GET');
		if (!result) return;
		if (result.code === 0) {
			this.setData({isGetCode: false});
			let time = 60;
			let clearTime = null;
			clearTime = setInterval(() => {	// 启动定时
				time--;
				this.setData({codeCopywriting: `${time}重新获取`});
				if (time === 0) {
					clearInterval(clearTime);
					this.setData({codeCopywriting: '获取验证码', isGetCode: true});
				}
			},1000);
		} else {
			this.setData({codeCopywriting: '获取验证码'});
			util.showToastNoIcon(result.message);
		}
	},
	// 修改
	uploadInfo (e) {
		console.log(e);
		let key = e.currentTarget.dataset.name;
		let imgUrl = e.currentTarget.dataset.url;
		app.globalData.orderInfo.orderId = this.data.orderId;
		switch (key) {
			case 'phone':	// 修改（手机号）
				this.setData({updatedPhone: false,'paper.handlePhone': '',available: false});
				break;
			case 'license':	// 修改（行驶证）
				util.go(`/pages/default/information_validation/information_validation`);
				break;
			case 'carHeadPhone':	// 修改（车头照）
				util.go(`/pages/default/upload_other_photo/upload_other_photo`);
				break;
			case 'idCard':	// 修改（身份证）
				util.go(`/pages/default/upload_id_card/upload_id_card`);
				break;
			case 'bigImg':
				this.selectComponent('#popTipComp').show({
					type: 'seven',
					title: '设备升级',
					btnShadowHide: true,
					url: imgUrl
				});
				break;
			default:
				break;
		}
	},
	fangDou (fn, time) {
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.setData({
					available: that.validateAvailable(true)
				});
			}, time);
		})();
	},
	// 按钮“确定”
    async next () {
        this.confirmCheck();
		if (this.data.paperIsExpire) return;
		let formData = this.data.formData;
		let paper = this.data.paper;
		let orderCardInfo = this.data.newOrderInfo.orderCardInfo;
		console.log(orderCardInfo);
		console.log('参数：',paper);
		let params = {
			clipCardCert: paper.simImg,
			dataType: '28', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			receiveMan: formData.userName, // 收货人姓名 【dataType包含2】
			receivePhone: formData.telNumber, // 收货人手机号 【dataType包含2】
			receiveProvince: formData.region[0], // 收货人省份 【dataType包含2】
			receiveCity: formData.region[1], // 收货人城市 【dataType包含2】
			receiveCounty: formData.region[2], // 收货人区县 【dataType包含2】
			receiveAddress: formData.detailInfo, // 收货人详细地址 【dataType包含2】
			areaCode: '0',	// 区域编码
			dataComplete: 1, // 订单资料是否已完善 1-是，0-否
			ownerIdCardNumber: orderCardInfo.idNumber,	// 身份证号码
			ownerIdCardTrueName: orderCardInfo.trueName,	// 身份证姓名
			ownerIdCardPositiveUri: orderCardInfo.positiveUrl,
			ownerIdCardNegativeUrt: orderCardInfo.negativeUrl,
			ownerIdCardSex: orderCardInfo.sex,	// 性别
			ownerIdcardBirth: orderCardInfo.birth,	// 生日
			ownerIdCardAddress: orderCardInfo.cardAddress,	// 居住地址
			ownerIdCardAuthority: orderCardInfo.authority,
			ownerIdCardValidDate: orderCardInfo.validDate,	// 有效期
			orderId: this.data.orderId,
			cardMobilePhone: paper.handlePhone, // 车主实名手机号
			cardPhoneCode: paper.code, // 手机号验证码
			notVerifyCardPhone: this.data.updatedPhone // true 时不需要验证码
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${result.data.orderId}`);
		} else {
			util.showToastNoIcon(result.message);
		}
    }

});
