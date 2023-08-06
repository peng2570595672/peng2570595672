// pages/road_rescue_orders/road_rescue_receive/road_rescue_receive.js
Page({

    data: {
        roadRescueList: {},
        carNo: [],
        carNoStr: ['贵', 'Z', 'Q', '0', '1', '0', '2'], // 车牌对应的数组
        isSelf1: false, // 是否选中"是"
        isSelf2: false, // 是否选中"否"
        agreement: false
    },

    onLoad () {
        let that = this;
        const eventChannel = that.getOpenerEventChannel();
        eventChannel.on('roadRescueList', function (res) {
            that.setData({
                roadRescueList: res.data
            });
        });
        let carNoStr = that.data.roadRescueList.vehPlates.split('');
        that.setData({carNoStr,carNo: carNoStr});
    },

    // 车辆是否在本人名下
    isSelf (e) {
        let index = parseInt(e.currentTarget.dataset.index);
        if (index === 1) {
            this.setData({isSelf1: true,isSelf2: false});
        } else {
            this.setData({isSelf1: false,isSelf2: true});
        }
    },

    // 是否同意相关要求
    agreementFunc () {
        this.setData({agreement: !this.data.agreement});
    },

    //
    goAgreement () {
    },

    // 立即办理
    handle () {

    }
});
