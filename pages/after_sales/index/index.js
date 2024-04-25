const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
        jumpList: [
            {icon: '',title: '售后工单',url: 'work_order',img: '',show: false},
            {icon: '',title: '设备注销',url: 'device_logout',img: '',show: true}
        ]
	},
	onLoad () {
	},
	async onShow () {
	},
    goPath (e) {
        let index = +e.currentTarget.dataset['index'];
        const item = this.data.jumpList[index];
        util.go(`/pages/after_sales/${item.url}/${item.url}`);
    }
});
