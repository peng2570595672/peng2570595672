export function ICCResetCmd () {
	return 'A801';
};
export function ICCChannelCmd () {
	return 'A3';
};
export function ESAMResetCmd () {
	return 'A803';
};
export function ESAMChannelCmd () {
	return 'A7';
};
export function ResetFlag () {
	return 'JLReset';
};
export function ChannelFlag () {
	return 'JLChannel';
};
export function successCode () {
	return 0;
};
export function errorCode () {
	return 1202;
};
export function timeOutCode () {
	return 1203;
};
export function cardNoExists () {
	return 1204;
};
export function bleSuccessCode () {
	return 0;
};
export function bleErrorCode () {
	return 1001;
};
export function disConnectError () {
	return 1101;
};
export function cosErrorCode () {
	return 1201;
};
export function ondisConnect () {
	return 1;
};
export function DevResult (type, objc) {
	var code = '';
	var err_msg = '';
	var data = null;
	var msg = '';
	if (objc.code == successCode()) {
		err_msg = '执行成功';
		if (type == 0) {
			var data = objc.data;
			var sw = data.substr(data.length - 4, 4);
			code = successCode();
			data = objc.data;
			msg = '操作成功';
		} else {
			code = objc.code;
			data = null;
			msg = objc.msg;
		}
		return {
			code: code,
			data: data,
			msg: msg
		};
	} else {
		return {
			code: objc.code,
			data: null,
			msg: objc.msg
		};
	}
};
