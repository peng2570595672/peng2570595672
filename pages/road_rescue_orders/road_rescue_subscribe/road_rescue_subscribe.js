const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        roadRescueList: {}, // 救援订单
        dateTime: '',
        agreement: false, // 是否同意相关要求
        imgList: [ // 上传道路救援资料
            {
                title1: '高速故障照片',
                desc: '上传高速故障照片\n请打日期和地址水印',
                exampleImgUrl: '', // 示例图路径
                uploadedUrl: '' // 已上传的图片路径
            },
            {
                title1: '车辆托起照片',
                desc: '上传车辆托起照片\n请打日期和地址水印',
                exampleImgUrl: '',
                uploadedUrl: ''
            },
            {
                title1: '高速救援发票照片',
                desc: '上传高速救援发票照片\n请打日期和地址水印',
                exampleImgUrl: '',
                uploadedUrl: ''
            },
            {
                title1: 'ETC通行记录照片',
                desc: '上传ETC通行记录照片\n请打日期和地址水印',
                exampleImgUrl: '',
                uploadedUrl: ''
            }
        ],
        collectionObj: { // 收款对象
            name: '可乐',
            price: '',
            cardNum: '',
            bank: ''
        }
    },

    onLoad () {
        let that = this;
        const eventChannel = that.getOpenerEventChannel();
        eventChannel.on('roadRescueList', function (res) {
            that.setData({
                roadRescueList: res.data
            });
        });
    },

    onShow () {

    },
    cDPopup (obj) {
        console.log(obj);
        this.setData({
            dateTime: obj.detail.dataTime
        });
    },

    selectedTime () {
        this.selectComponent('#cdPopup').show({
            isBtnClose: true,
            argObj: {
                type: 'selectedTime',
                title: '请选择呼叫救援时间'
            }
        });
    },
    // 是否同意相关要求
    agreementFunc () {
        this.setData({agreement: !this.data.agreement});
    },
    // 上传图片(拍照/获取手机图片)
    uploadFunc (e) {
        util.showLoading();
        let that = this;
        let imgIndex = e.currentTarget.dataset.index;
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success (res) {
                // tempFilePath可以作为img标签的src属性显示图片
                if (res.errMsg === 'chooseImage:ok') {
                    const tempFilePaths = res.tempFilePaths;
                    let imgFormat = ['jpg','png','jepg'];
                    imgFormat.map(item => {
                        if (tempFilePaths[0].includes(item,-1)) {
                            that.uploadFunc1(tempFilePaths,imgIndex);
                        }
                    });
                    util.hideLoading();
                }
            },
            fail (res) {
                util.showToastNoIcon('接口调用失败');
            }
        });
    },
    // 上传图片(把图片上传服务器)
    uploadFunc1 (path,imgIndex) {
        // 上传文件
		util.uploadFile(path[0], () => {
			util.showToastNoIcon('上传失败！');
		}, (res) => {
			if (res) {
				res = JSON.parse(res);
				if (res.code === 0) { // 文件上传成功
                    util.showToastNoIcon('上传成功');
                    let imgList = this.data.imgList.map((item,index) => {
                        if (index === imgIndex) {
                            item.uploadedUrl = res.data[0].fileUrl;
                        }
                        return item;
                    });
                    this.setData({imgList});
				} else { // 文件上传失败
					util.showToastNoIcon(res.message);
				}
			} else { // 文件上传失败
				util.showToastNoIcon('上传失败');
			}
		}, () => {
			util.hideLoading();
		});
    },

    // 展示示例图
    exampleFunc (e) {
        console.log('示例：',e);
    },

    // 立即提交
    subcribe () {
        if (!this.data.agreement) {
            return util.showToastNoIcon('请同意协议');
        }
        // 订阅消息
		util.subscribe('IL7teM6zMDMLY159JmPNSYKoT8RztRpxpEx6lgjuz_k', '/pages/road_rescue_orders/road_rescue_detail/road_rescue_detail');
    }
});
