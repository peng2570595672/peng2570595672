// pages/function_fewer_pages/che_e_bao/che_e_bao.js
Page({

    data: {

    },
    onLoad (options) {

    },
    onShow () {

    },
    btnFunc () {
        this.selectComponent('#cdPopup').show({
            isBtnClose: true,
            argObj: {
                type: 'cheEBao',
                title: '办理产品',
                wxPhone: '15870105857',
                btnText: '确定办理'
            }
        });
    },
    onUnload () {

    }
});
