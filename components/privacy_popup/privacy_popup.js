let privacyHandler;
let privacyResolves = new Set();
let closeOtherPagePopUpHooks = new Set();

wx.onNeedPrivacyAuthorization(resolve => {
	if (typeof privacyHandler === 'function') {
		privacyHandler(resolve);
	}
});

const closeOtherPagePopUp = (closePopUp) => {
	closeOtherPagePopUpHooks.forEach(hook => {
		if (closePopUp !== hook) {
			hook();
		}
	});
};

Component({
	data: {
		title: '用户隐私保护提示',
		desc1: '请您务必仔细阅读并充分理解《用户隐私保护指南》里的条款，包括但不限于为了向您提供更好的服务，我们需要收集您的头像昵称、蓝牙、相册等。您可以通过阅读',
		urlTitle: '《用户隐私保护指引》',
		desc2: '了解详细信息，当您点击同意并接受按钮开始使用产品服务时，即表示您已理解并同意该条款内容，该条款将对您产生法律约束力。',
		innerShow: false
	},
	lifetimes: {
		attached: function () {
			const closePopUp = () => {
				this.disPopUp();
			};
			privacyHandler = resolve => {
				privacyResolves.add(resolve);
				console.log(resolve);
				this.popUp();
				// 额外逻辑：当前页面的隐私弹窗弹起的时候，关掉其他页面的隐私弹窗
				closeOtherPagePopUp(closePopUp);
			};

			closeOtherPagePopUpHooks.add(closePopUp);

			this.closePopUp = closePopUp;
		},
		detached: function () {
			closeOtherPagePopUpHooks.delete(this.closePopUp);
		}
	},
	methods: {
		handleAgree (e) {
			this.disPopUp();
			// 这里演示了同时调用多个wx隐私接口时要如何处理：让隐私弹窗保持单例，点击一次同意按钮即可让所有pending中的wx隐私接口继续执行 （看page/index/index中的 wx.getClipboardData 和 wx.startCompass）
			privacyResolves.forEach(resolve => {
				resolve({
					event: 'agree',
					buttonId: 'agree-btn'
				});
			});
			privacyResolves.clear();
		},
		handleDisagree (e) {
			this.disPopUp();
			privacyResolves.forEach(resolve => {
				resolve({
					event: 'disagree'
				});
			});
			privacyResolves.clear();
		},
		popUp () {
			if (this.data.innerShow === false) {
				this.setData({
					innerShow: true
				});
			}
		},
		disPopUp () {
			if (this.data.innerShow === true) {
				this.setData({
					innerShow: false
				});
			}
		},
		openPrivacyContract () {
			wx.openPrivacyContract({
				success: res => {
					console.log('openPrivacyContract success');
				},
				fail: res => {
					console.error('openPrivacyContract fail', res);
				}
			});
		}
	}
});
