import { goHome } from '../../utils/util';
const app = getApp();
Component({
	properties: {
		title: {
			type: String,
			value: ''
		},
		background: {
			type: String,
			value: '#1296db'
		},
		isShowArrow: {
			type: Boolean,
			value: false
		},
		list: {
			type: Array,
			value: []
		}
	},
	data: {
		capsuleTop: '',
		capsuleHeight: '',
		navbarHeight: ''
	},
	attached () {
		this.setData({
			capsuleTop: app.globalData.capsule.top,
			capsuleHeight: app.globalData.capsule.height,
			navbarHeight: (app.globalData.capsule.top - app.globalData.statusBarHeight) * 2 + app.globalData.capsule.height + app.globalData.statusBarHeight
		});
	},
	methods: {
		handleGoToBack () {
			goHome(false);
		}
	}
});
