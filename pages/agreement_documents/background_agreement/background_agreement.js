const util = require('../../../utils/util.js');
Page({
    data: {
        agreementContent: '' // 协议内容
    },

    async onLoad (options) {
        let that = this;
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('acceptDataFromOpenerPage', function (data) {
            let res = data.data;
            console.log(res);
            wx.setNavigationBarTitle({
                title: res.name
            });
            if (res.contentType === 1) { // 富文本
                that.setData({
                    agreementContent: res.content
                });
            } else { // pdf文件
                that.openHandle(res.content,res.title);
            }
        });
        // 查询是否欠款
		await util.getIsArrearage();
    },

    onShow () {

    },
    openHandle (url,title) {
      console.log('哈哈',url,title);
        let that = this;
        const fileExtName = '.pdf';
        const randfile = title + fileExtName;
        const newPath = `${wx.env.USER_DATA_PATH}/${randfile}`; // 定义一个临时路径
        that.deletContract(); // 将本地文件删除
        wx.downloadFile({
            url: url, // 网络文件的地址
            header: {
                'content-type': 'application/pdf'
                // Authorization: wx.getStorageSync('token')
            },
            filePath: newPath,
            success: function (res) {
                console.log('下载到本地：',res);
                const filePath = res.tempFilePath;
                wx.openDocument({
                    filePath: filePath,
                    showMenu: true,
                    fileType: 'pdf',
                    success: function (res) {
                        that.setData({agreementContent: res});
                    },
                    fail: function (res) {
                      console.log(res);
                    }
                });
            },
            fail: function (res) {
                wx.hideLoading();
            }
          });
      },
      // 删除本地文件
      deletContract () {
          try {
              let file = wx.getFileSystemManager();
              console.log('文件',file);
              file.readdir({
                  dirPath: `${wx.env.USER_DATA_PATH}`,
                  success: (res) => {
                      console.log('xxxxx',res);
                      if (res.files.length > 2) {
                          file.unlink({
                              filePath: `${wx.env.USER_DATA_PATH}/${res.files[0]}`,
                              complete: (res) => {}
                          });
                      }
                  }
              });
          } catch (error) {}
      }
});
