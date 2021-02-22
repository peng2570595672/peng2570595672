module.exports = {
	extends: "standard",
	settings: {
		"import/resolver": {
			"babel-module": {}
		}
	},
	parserOptions: {
		ecmaVersion: 2020
	},
	rules: {
		'no-console': 'off', // 允许在代码中保留 console 命令
		"prefer-const": 0,//首选const
		"no-control-regex": 0,//允许在正则表达式中使用控制字符
		"no-const-assign": 2,// 禁止修改const声明的变量
		"no-extend-native": 0,// 允许扩展native对象
		"indent": [0, 4],// 缩进风格
		"no-undef": 0,// 未定义的变量
		"semi": [2, "always"],
		"camelcase": 2,// 强制驼峰法命名
		"no-array-constructor": 2,
		"no-plusplus": 0,//禁止使用++，--
		"generator-star-spacing": 'off',
		"prefer-destructuring": 0,
		"linebreak-style": [0, "windows"],//换行风格
		"no-lonely-if": 0,//禁止else语句内只有if语句
		"comma-dangle": [2, "never"],//对象字面量项尾不能有逗号
		"object-shorthand": 0,//强制对象字面量缩写语法
		"dot-notation": [0, {"allowKeywords": true}],//避免不必要的方括号
		"no-param-reassign": 0,//禁止给参数重新赋值
		"no-unused-expressions": 0,//禁止无用的表达式
		"radix": 0,//parseInt必须指定第二个参数
		"no-else-return": 0,//如果if语句里面有return,后面不能跟else语句
		"comma-spacing": 0,//逗号前后的空格
		"no-shadow": 0,//外部作用域中的变量不能与它所包含的作用域中的变量或参数同名
		"max-len": [0, 80, 4],//字符串最大长度
		"no-useless-escape": 0,//禁止不必要的call和apply
		"no-unneeded-ternary": 0,//禁止不必要的嵌套 var isYes = answer === 1 ? true : false;
		"no-unused-vars": [0, {"vars": "all", "args": "after-used"}],//不能有声明后未被使用的变量或参数
		"guard-for-in": 0,//for in循环要用if语句过滤
		"no-restricted-syntax": 0,
		"no-continue": 0,//禁止使用continue
		"no-nested-ternary": 0,//禁止使用嵌套的三目运算
		"arrow-body-style": 0,//禁止使用嵌套的三目运算
		"no-bitwise": 0,//禁止使用按位运算符
		"object-curly-spacing": [0, "never"],//大括号内是否允许不必要的空格
		"no-tabs": 0,
		"space-before-function-paren": [2, "always"],//函数定义时括号前面要不要有空格
		"import/no-duplicates": 0
	},
	globals: {
		wx: null,
		App: null,
		Page: null,
		getApp: null,
		Component: null,
	}
};
