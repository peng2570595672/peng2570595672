const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        roadRescueList: {}, // 救援订单
        dateTime: ''
    },

    onLoad () {
        let that = this;
        const eventChannel = that.getOpenerEventChannel();
        eventChannel.on('roadRescueList', function (res) {
            that.setData({
                roadRescueList: res.data
            });
        });
        console.log(that.data.roadRescueList);
    },

    onShow () {

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
    cDPopup (obj) {
        console.log(obj);
        this.setData({
            dateTime: obj.detail.dataTime
        });
    }
});
