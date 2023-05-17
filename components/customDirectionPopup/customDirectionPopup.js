const util = require('../../utils/util.js');
const app = getApp();
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    data: {
        mask: false, // 控制遮罩层的显示/隐藏
        make: false, // 控制表示层的显示/隐藏
        isBtnClose: true, // 传递过来的参数
        argObj: [{
            title: '上弹'
        }], // 传递过来的参数
        onceBtn: false // 控制点击的触发次数
    },

    methods: {
        show (obj) {
            let isBtnClose = obj.isBtnClose === true ? obj.isBtnClose : false;
            let argObj = obj.argObj || this.data.argObj;
            this.setData({
                mask: true,
                make: true,
                isBtnClose,
                argObj
            });
        },
        hide () {
            let that = this;
            that.setData({
                mask: false,
                onceBtn: false
            });
            setTimeout(() => {
                that.setData({ make: false });
            }, 380);
        },
        // 点击触发事件
        btnGo (e) {
            let that = this;
            let obj = e.currentTarget.dataset.item;
            if (obj.jump && !that.data.onceBtn) {
                util.go(`${obj.url}`);
                that.setData({ onceBtn: true });
            }
            setTimeout(() => {
                that.hide();
            }, 200);
        }
    }
});
