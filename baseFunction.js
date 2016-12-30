var svgCaptcha = require('svg-captcha');

function captcha(req) {
    let captcha = svgCaptcha.create({
        size: 4, // 驗證碼長度
        ignoreChars: '0o1il', // 驗證碼字符中排除 0o1il
        noise: 1, // 干擾綫條的數量
        color: true, // 驗證碼的字符有顔色
        //background: '#cc9966' // 驗證碼圖片背景顔色
    });
    req.session.captcha = captcha.text;
    return captcha.data;
};



module.exports = {
    captcha: captcha,
};