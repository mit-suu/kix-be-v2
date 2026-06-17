const crypto = require('crypto');
const qs = require('qs');

/**
 * Sort object theo thu tu alphabet va encode key/value
 * Day la ham sortObject CHUAN tu code demo VNPay
 * https://sandbox.vnpayment.vn/apis/vnpay-demo
 */
function sortObject(obj) {
    var sorted = {};
    var str = [];
    var key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
}

/**
 * Bo dau tieng Viet - VNPay yeu cau vnp_OrderInfo khong co dau
 */
function removeDiacritics(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
}

/**
 * Tao URL thanh toan VNPay - theo dung code demo chinh thuc
 *
 * Flow:
 * 1. Tao params object voi raw values
 * 2. sortObject() => sort + encodeURIComponent ca key va value
 * 3. qs.stringify({ encode: false }) => tao sign data (khong encode lan 2)
 * 4. HMAC-SHA512(signData, secretKey) => tao chu ky
 * 5. Gan vnp_SecureHash vao params, stringify lai thanh URL
 */
function createVnpayUrl({
    tmnCode,
    secretKey,
    vnpUrl,
    returnUrl,
    orderId,
    amount,
    orderInfo,
    ipAddr,
    locale = 'vn',
    bankCode = '',
}) {
    var date = new Date();

    // Format date: yyyyMMddHHmmss (local time - giong code demo dung dateformat)
    var pad = (n) => String(n).padStart(2, '0');
    var createDate = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

    var expireDate = new Date(date.getTime() + 15 * 60 * 1000);
    var expireDateStr = `${expireDate.getFullYear()}${pad(expireDate.getMonth() + 1)}${pad(expireDate.getDate())}${pad(expireDate.getHours())}${pad(expireDate.getMinutes())}${pad(expireDate.getSeconds())}`;

    // Normalize IP
    var ip = String(ipAddr || '127.0.0.1');
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    } else if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    // Loai bo dau tieng Viet khoi orderInfo
    var sanitizedOrderInfo = removeDiacritics(orderInfo);

    var vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = String(orderId);
    vnp_Params['vnp_OrderInfo'] = sanitizedOrderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ip;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDateStr;

    if (bankCode !== null && bankCode !== '' && bankCode !== undefined) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    var signData = qs.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
}

/**
 * Xac thuc chu ky VNPay khi nhan redirect/IPN ve
 * Theo dung code demo VNPay
 */
function verifyVnpayReturn(query, secretKey) {
    var vnp_Params = Object.assign({}, query);
    var secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    var signData = qs.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
}

module.exports = { createVnpayUrl, verifyVnpayReturn };
