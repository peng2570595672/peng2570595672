const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        roadRescueList: {} // 救援订单
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

    }

});
