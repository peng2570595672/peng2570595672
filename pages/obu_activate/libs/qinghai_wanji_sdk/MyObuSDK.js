/**
 * @author 林禄福
 */
import wjBleAPI from "./wjBleAPI";
// 获取单个指令
function getSubCMD(cmd) {
	let len = cmd.length / 2;
	len = (Array(2).join(0) + len.toString(16)).slice(-2);
	return `01${len}${cmd}`;
}
// 获取组合指令
function getCMD(cmdArray) {
	let cmd = '';
	for (let v of cmdArray) {
		cmd += getSubCMD(v);
	}
	return cmd;
}
// 将结果字符串拆成结果数组
function  strToArr(arr,l,res) {
	if (res) {
		let len = res.substring(2, 4);
		let str = res.substring(4, parseInt(len, 16) * 2 + 4);
		arr.push(str);
		strToArr(arr,str.length,res.substring(str.length+4));
	}
}
// icc 和 ESAM透传 cmdtype === 10 ICC cmdtype === 20 ESAM
export function transCmd(cmdArray, cmdtype, callback) {
	wjBleAPI.transCommandPlain(getCMD(cmdArray), cmdtype, '82', (res) => {
		let obj = {};
		if (res.serviceCode === 0) {
			let arr = [];
			strToArr(arr,0,res.serviceData.dataBuff.toUpperCase());
			let isOk = true;
			// 指令执行成功 并正确返回
			for (let v of arr) {
				if (v.slice(-4) !== '9000') {
					isOk = false;
					break;
				}
			}
			if (isOk) {
				obj['code'] = 0;
				obj['data'] = arr;
				obj['msg'] = '操作成功';
			} else {
				obj['code'] = -1;
				obj['msg'] = '操作失败，请重试！';
			}
		} else {
			obj['code'] = -1;
			obj['msg'] = res.serviceInfo;
		}
		callback(obj);
	})
}


