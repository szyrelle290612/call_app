import PhoneNumber from 'awesome-phonenumber';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import mime from 'mime-types';
import fs from 'fs';

import PhoneTimeZone from "./PhoneTimeZone";
import { GRITTER_STATUS } from './Const';
import './PhoneNumberParser';
import 'colors'

// import { http, https } from 'follow-redirects';
class Utilities {
    constructor() {
        this.mt = [];
        this.mti = 625;
    }
    min(a, b) {
        if (a < b)
            return a;
        return b;
    }
    max(a, b) {
        if (a > b)
            return a;
        return b;
    }
    decodeBase64(ciphertxt) {
        if (Meteor.isClient)
            return atob(ciphertxt);
        if (Meteor.isServer) {
            return Buffer.from(ciphertxt, 'base64').toString('ascii');
            return new Buffer(ciphertxt, 'base64').toString();
        }
        return ciphertxt;
    }
    encodeBase64(plaintxt) {
        if (Meteor.isClient)
            return btoa(plaintxt);
        if (Meteor.isServer) {
            return Buffer.from(plaintxt).toString('base64');
        }
        return plaintxt
    }
    random(max, min) {
        return Math.floor(Math.random() * max) + min;
    }
    genRandomString(length, option) {
        let that = this;
        let retval = '';
        option = option || 0x7;
        while (retval.length < length) retval += (() => {
            let mask = '';
            if (option & 0x1)
                mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (option & 0x2)
                mask += 'abcdefghijklmnopqrstuvwxyz';
            if (option & 0x4)
                mask += '0123456789';
            if (option & 0x8)
                mask += '~`!@#$%^&*()_+-=,.<>|';
            return mask[that.random(mask.length, 0)];
        })();
        return retval;
    }
    generateRandomHexColor() {
        return '#' + ((1 << 24) * (Math.random() + 1) | 0).toString(16).substr(1);
    };
    changeHue(rgb, degree) {
        let hsl = this.rgbToHSL(rgb);
        hsl.h += degree;
        if (hsl.h > 360) {
            hsl.h -= 360;
        }
        else if (hsl.h < 0) {
            hsl.h += 360;
        }
        return this.hslToRGB(hsl);
    }
    rgbToHSL(rgb) {
        // strip the leading # if it's there
        rgb = rgb.replace(/^\s*#|\s*$/g, '');

        // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
        if (rgb.length == 3) {
            rgb = rgb.replace(/(.)/g, '$1$1');
        }

        let r = parseInt(rgb.substr(0, 2), 16) / 255,
            g = parseInt(rgb.substr(2, 2), 16) / 255,
            b = parseInt(rgb.substr(4, 2), 16) / 255,
            cMax = Math.max(r, g, b),
            cMin = Math.min(r, g, b),
            delta = cMax - cMin,
            l = (cMax + cMin) / 2,
            h = 0,
            s = 0;

        if (delta == 0) {
            h = 0;
        }
        else if (cMax == r) {
            h = 60 * (((g - b) / delta) % 6);
        }
        else if (cMax == g) {
            h = 60 * (((b - r) / delta) + 2);
        }
        else {
            h = 60 * (((r - g) / delta) + 4);
        }

        if (delta == 0) {
            s = 0;
        }
        else {
            s = (delta / (1 - Math.abs(2 * l - 1)))
        }

        return {
            h: h,
            s: s,
            l: l
        }
    }
    hslToRGB(hsl) {
        let h = hsl.h,
            s = hsl.s,
            l = hsl.l,
            c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c / 2,
            r, g, b;

        if (h < 60) {
            r = c;
            g = x;
            b = 0;
        }
        else if (h < 120) {
            r = x;
            g = c;
            b = 0;
        }
        else if (h < 180) {
            r = 0;
            g = c;
            b = x;
        }
        else if (h < 240) {
            r = 0;
            g = x;
            b = c;
        }
        else if (h < 300) {
            r = x;
            g = 0;
            b = c;
        }
        else {
            r = c;
            g = 0;
            b = x;
        }

        r = this.normalize_rgb_value(r, m);
        g = this.normalize_rgb_value(g, m);
        b = this.normalize_rgb_value(b, m);

        return this.rgbToHex(r, g, b);
    }

    normalize_rgb_value(color, m) {
        color = Math.floor((color + m) * 255);
        if (color < 0) {
            color = 0;
        }
        return color;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    formatNumber(input, format) {
        if (input) {
            let digits = input.replace(/\D/g, '');
            if (digits.length > 10)
                digits = digits.substring(digits.length - 10, 11);
            let count = 0;
            return format.replace(/X/g, () => {
                return digits.charAt(count++);
            });
        }
        return input;
    }
    httpRequest(url, method, params, data, headers) {
        if (method.toLowerCase() != 'get' && method.toLowerCase() != 'post') {
            return {
                statusCode: 400,
                body: 'Bad Request'
            };
        }
        try {
            let opts = {};
            let h = headers;
            let p = params;
            let d = data;
            if (h) opts.headers = h;
            if (p) opts.params = p;
            if (d) opts.data = d;
            let result = HTTP.call(method.toUpperCase(), url, opts);
            return {
                statusCode: 200,
                data: result.content
            };
        } catch (e) {
            return {
                statusCode: (e.response) ? e.response.statusCode : 400,
                data: (e.response) ? e.response.data : 'Cannot make HTTP request'
            };
        }
    }
    numberValidator(input) {
        if (!input) return { isValid: false };
        let check = parsePhoneNumber(input);
        if (check && check.o) {
            const phone = PhoneNumber(check.u);
            if (phone.isValid()) {
                let isUS = false;
                switch (phone.getRegionCode()) {
                    case 'US': case 'CA':
                    case 'AG': case 'AI': case 'AS': case 'BB': case 'BM': case 'BS':
                    case 'DM': case 'DO': case 'GD': case 'GU': case 'JM': case 'KN':
                    case 'KY': case 'LC': case 'MP': case 'MS': case 'PR': case 'SX':
                    case 'TC': case 'TT': case 'VC': case 'VG': case 'VI': case 'UM':
                        isUS = true;
                        break;
                }
                return {
                    isValid: phone.isValid(),
                    fromUS: isUS,
                    region: phone.getRegionCode(),
                    internationalFormat: phone.getNumber("international"),
                    nationalFormat: phone.getNumber("national"),
                    e164Format: phone.getNumber("e164"),
                    rfc3966Format: phone.getNumber("rfc3966"),
                    significant: phone.getNumber("significant"),
                    number: input,
                };
            }
        }
        return { isValid: false };
    }
    encodeUTF8(string) {
        if (!string)
            return '';
        try {
            return unescape(encodeURIComponent(string));
        } catch (err) {
            return string;
        }
    }
    decodeUTF8(string) {
        if (!string)
            return '';
        try {
            return decodeURIComponent(escape(string));
        } catch (err) {
            return string;
        }
    }
    timeFromNow(date) {
        let a = moment(date);
        let b = moment();
        return a.from(b);
    }
    objectEquals(x, y) {
        if (x instanceof Function) {
            if (y instanceof Function) {
                return x.toString() === y.toString();
            }
            return false;
        }
        if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
        if (x === y || x.valueOf() === y.valueOf()) { return true; }
        if (x instanceof Date) { return false; }
        if (y instanceof Date) { return false; }
        if (!(x instanceof Object)) { return false; }
        if (!(y instanceof Object)) { return false; }

        let p = Object.keys(x);
        return Object.keys(y).every((i) => p.indexOf(i) !== -1) ? p.every((i) => this.objectEquals(x[i], y[i])) : false;
    }
    setupHandler(instance, target, cursor, transform, free) {
        let count = 0;
        let init = true;
        if (!free)
            count = cursor.count();
        let handle = cursor.observe({
            added: (doc) => {
                let id = doc._id;
                doc = transform(doc);
                if (!free) {
                    if (init) // boost the initial rendering..
                        doc.max = count;
                    else
                        doc.max = cursor.count();
                }
                instance.added(target, id, doc);
            },
            changed: (doc) => {
                let id = doc._id;
                doc = transform(doc);
                if (!free)
                    doc.max = cursor.count();
                instance.changed(target, id, doc);
            },
            removed: (doc) => {
                instance.removed(target, doc._id);
            }
        });
        init = false;
        instance.onStop(() => {
            handle.stop();
        });
    }
    checkEmailFormat(string) {
        if (string) {
            let re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return re.test(string);
        }
        return string;
    }
    checkIfHTML(string) {
        return /<[a-z][\s\S]*>/i.test(string);
    }
    capitalize(string) {
        if (!string)
            return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    showGritter(title, text, status) {
        if (Meteor.isClient) {
            $.gritter.add({
                title: title,
                text: text,
                class_name: status,
                time: 10000,
            });
            return;
        }
    }
    checkUnicode(txt) {
        let check = txt.replace(/[a-z0-9`~!@#$%^&*()_|+\-=?;:'", .<>\{\}\[\]\\\/\n]/gi, '');
        return check.length != txt.length;
    }
    affixResponse(instance, statusCode, headers, body) {
        if (instance) {
            instance.statusCode = statusCode;
            for (let head in headers) {
                instance.setHeader(head, headers[head]);
            }
            instance.write(body)
            instance.end();
        }
    }
    checkHooks(data, hooks) {
        if (typeof data === 'object') {
            for (let i = 0; i < hooks.length; i++) {
                if (data[hooks[i]] == null)
                    return false;
            }
            return true;
        }
        return false;
    }
    downloadFile(url, saveto, callback, retry = 1) {
        if (Meteor.isServer) {
            let protocol = null;
            if (url) {
                showStatus(`Downloading '${url}'...`);
                if (url.indexOf('http:') == 0)
                    protocol = http;
                else if (url.indexOf('https:') == 0)
                    protocol = https;
            }
            if (protocol) {
                try {
                    protocol.get(url, function (res) {
                        if (res) {
                            if (retry > 10) {
                                if (callback)
                                    callback.call(this, {
                                        failed: true
                                    });
                                return;
                            }
                            if (res.statusCode == 200) {
                                let filename = "";
                                let disposition = res.headers['content-disposition'];
                                let mimetype = res.headers['content-type'];
                                let fileSize = res.headers['content-length'];
                                let matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);

                                if (matches != null && matches[1]) {
                                    filename = matches[1].replace(/['"]/g, '');
                                } else {
                                    filename = url.substring(url.lastIndexOf('/') + 1);
                                    if (!mime.lookup(filename)) {
                                        let ext = mime.extension(mimetype);
                                        filename = `file_${moment().valueOf()}.${ext}`;
                                    } else {
                                        mimetype = mime.lookup(filename);
                                    }
                                }
                                let localFile = `${moment().format('MMDDYYYYhhmmss')}_${filename}`;
                                let localPath = `${saveto}${localFile}`;
                                let file = fs.createWriteStream(localPath);

                                res.on('data', function (d) {
                                    file.write(d);
                                }).on('end', function () {
                                    file.close();
                                    setTimeout(() => {
                                        try {
                                            const stats = fs.statSync(localPath);
                                            const fileSizeInBytes = stats.size;

                                            if (fileSizeInBytes != fileSize) {
                                                showNotice('Retrying download(%sx)...err: %s', retry, 'Incomplete data!');
                                                setTimeout(() => {
                                                    Util.downloadFile(url, saveto, callback, retry + 1);
                                                }, 5000);
                                                return;
                                            }
                                            showStatus(`Download complete and save at ${localPath}`);
                                            if (callback)
                                                callback.call(this, {
                                                    filename: filename,
                                                    mimetype: mimetype,
                                                    savepath: localFile
                                                });
                                        } catch (err) {
                                            showError('Fail to check file, retrying... err: %s path: `%s`', err.message, localPath);
                                            Util.downloadFile(url, saveto, callback, retry + 1);
                                        }
                                    }, 500);
                                });
                            } else {
                                if (retry > 5) {
                                    if (callback)
                                        callback.call(this, {
                                            failed: true
                                        });
                                } else {
                                    showNotice('Retrying download(%sx)...err: %s', retry, res.statusCode);
                                    setTimeout(() => {
                                        Util.downloadFile(url, saveto, callback, retry + 1);
                                    }, 5000);
                                }
                            }
                        }
                    }).on('error', (err) => {
                        if (retry > 5) {
                            if (callback)
                                callback.call(this, {
                                    failed: true
                                });
                        } else {
                            showNotice('Retrying download(%sx)...err: %s', retry, err.message);
                            setTimeout(() => {
                                Util.downloadFile(url, saveto, callback, retry + 1);
                            }, 10000);
                        }
                    });
                } catch (err) {
                    showError('Download err: %s', err);
                }
            } else {
                showError(`Nothing to download invalid url (${url})`);
            }
        }
    }
    shortenURL(longurl) {
        if (Meteor.isServer) {
            let url = "https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyBVWf5f6uoFyLlulWEB-Ejzx6Pk_Kvx2Z8";
            let data = { "longUrl": longurl };
            try {
                let result = HTTP.call("POST", url, { headers: { 'Content-Type': 'application/json' }, data: data, timeout: 3000 });
                if (result && result.statusCode == 200) {
                    return result.data;
                } else {
                    showDebug(`Fail to shorten url ${longurl}. err:`, result); // TODO: get actual error
                }
            } catch (err) {
                showError(`Fail to shorten url ${longurl}. err:`, err);
            }
        }
        return '';
    }
    analyzeSentiment(text) {
        if (Meteor.isServer) {
            if (text && text.trim().length) {
                let key = Meteor.settings.public.google.apiKey;
                let url = `https://language.googleapis.com/v1beta2/documents:analyzeSentiment?key=${key}`;
                let data = { "document": { "type": "PLAIN_TEXT", "content": text }, "encodingType": "UTF16" };
                try {
                    let result = HTTP.call("POST", url, { headers: { 'Content-Type': 'application/json' }, data: data, timeout: 3000 });
                    if (result && result.statusCode == 200) {
                        return result.data;
                    } else {
                        showDebug(`Fail to analyze text ${text}. err:`, result); // TODO: get actual error
                    }
                } catch (err) {
                    showError(`Fail to analyze text ${text}. err:`, err);
                }
            }
        }
    }
    doNotification(title, message) {
        if (Meteor.isClient) {
            let options = {
                body: message,
                icon: '/img/txtmeQuick_Q.png'
            }
            if (!("Notification" in window)) {
                this.gritter(title, message, GRITTER_STATUS.NOTICE);
            }
            else if (Notification.permission === "granted") {
                let notification = new Notification(title, options);
                setTimeout(notification.close.bind(notification), 10000);
                notification.onclick = function () {
                    window.focus();
                };
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
                    if (permission === "granted") {
                        let notification = new Notification(title, options);
                        setTimeout(notification.close.bind(notification), 5000);
                        notification.onclick = function () {
                            window.focus();
                        };
                    } else {
                        this.gritter(title, message, GRITTER_STATUS.NOTICE);
                    }
                });
            }
        }
    }
    formatArgs(arg) {
        let keys = Object.keys(arg);
        keys.splice(0, 1);
        let retval = keys.map((index) => {
            if (typeof arg[index] === 'number')
                return `${arg[index]}`.blue;
            else if (typeof arg[index] != 'string')
                return arg[index] ? JSON.stringify(arg[index]).magenta : arg[index];
            return `${arg[index]}`.grey;
        });
        if (!retval.length)
            return '';
        return retval;
    }
    log() {
        if (console) {
            console.log.apply(console, arguments);
        }
    }
    showNotice() {
        Util.log.apply(this, [`${"[Notice]: ".white}${arguments[0]}`].concat(Util.formatArgs(arguments)));
    }
    showStatus() {
        Util.log.apply(this, [`${"[Status]".green}${":".white} ${arguments[0]}`].concat(Util.formatArgs(arguments)));
    }
    showError() {
        Util.log.apply(this, [`${"[Error]".red}${":".white} ${arguments[0]}`].concat(Util.formatArgs(arguments)));
    }
    showWarning() {
        Util.log.apply(this, [`${"[Warning]".yellow}${":".white} ${arguments[0]}`].concat(Util.formatArgs(arguments)));
    }
    showDebug() {
        Util.log.apply(this, [`${"[Debug]".magenta}${":".white} ${arguments[0]}`].concat(Util.formatArgs(arguments)));
    }
    toTimeLapse(duration) {
        if (duration) {
            let day = 0, hr = 0, min = 0, sec = 0;
            if (duration >= (1000 * 60 * 60 * 24)) {
                day = Math.floor(duration / (1000 * 60 * 60 * 24));
                duration -= day * 1000 * 60 * 60 * 24;
            }
            if (duration >= (1000 * 60 * 60)) {
                hr = Math.floor(duration / (1000 * 60 * 60));
                duration -= hr * 1000 * 60 * 60;
            }
            if (duration >= (1000 * 60)) {
                min = Math.floor(duration / (1000 * 60));
                duration -= min * 1000 * 60;
            }
            sec = Math.floor(duration / 1000);

            if (day > 0) {
                let temp = [];
                temp.push(day);
                temp.push('day');
                if (hr > 0) {
                    temp.push(hr);
                    temp.push('hr');
                }
                if (min > 0) {
                    temp.push(min);
                    temp.push('min');
                }
                if (sec > 0) {
                    temp.push(sec);
                    temp.push('sec');
                }
                duration = temp.join(' ');
            }
            else if (hr > 0) {
                let temp = [];
                temp.push(hr);
                temp.push('hr');
                if (min > 0) {
                    temp.push(min);
                    temp.push('min');
                }
                if (sec > 0) {
                    temp.push(sec);
                    temp.push('sec');
                }
                duration = temp.join(' ');
            } else if (min > 0) {
                let temp = [];
                temp.push(min);
                temp.push('min');
                if (sec > 0) {
                    temp.push(sec);
                    temp.push('sec');
                }
                duration = temp.join(' ');
            } else {
                if (sec > 0)
                    duration = [sec, 'sec'].join(' ');
                else
                    duration += 'ms';
            }
            return duration;
        }
        return '0ms';
    }
    insertText(input, text) {
        if (input == undefined) { return; }
        let scrollPos = input.scrollTop;
        let pos = 0;
        let browser = ((input.selectionStart || input.selectionStart == "0") ?
            "ff" : (document.selection ? "ie" : false));
        if (browser == "ie") {
            input.focus();
            let range = document.selection.createRange();
            range.moveStart("character", -input.value.length);
            pos = range.text.length;
        }
        else if (browser == "ff") { pos = input.selectionStart };

        let front = (input.value).substring(0, pos);
        let back = (input.value).substring(pos, input.value.length);
        input.value = front + text + back;
        pos = pos + text.length;
        if (browser == "ie") {
            input.focus();
            let range = document.selection.createRange();
            range.moveStart("character", -input.value.length);
            range.moveStart("character", pos);
            range.moveEnd("character", 0);
            range.select();
        }
        else if (browser == "ff") {
            input.selectionStart = pos;
            input.selectionEnd = pos;
            input.focus();
        }
        input.scrollTop = scrollPos;
    }
    flattenObj(object, separator = '.') {
        let isValidObject = value => {
            if (!value) {
                return false
            }

            const isArray = Array.isArray(value)
            const isObject = Object.prototype.toString.call(value) === '[object Object]'
            const hasKeys = !!Object.keys(value).length

            return !isArray && isObject && hasKeys
        }

        const walker = (child, path = []) => {
            return Object.assign({}, ...Object.keys(child).map(key => isValidObject(child[key])
                ? walker(child[key], path.concat([key]))
                : { [path.concat([key]).join(separator)]: child[key] })
            )
        }
        return Object.assign({}, walker(object))
    }
    ping(ip, callback) {
        if (!this.inUse) {
            let _that = this;
            this.status = 'unchecked';
            this.inUse = true;
            this.callback = callback;
            this.ip = ip;
            this.img = new Image();
            this.start = new Date().getTime();
            this.img.onload = function () {
                _that.inUse = false;
                _that.callback(new Date().getTime() - _that.start);
            };
            this.img.onerror = function (e) {
                if (_that.inUse) {
                    _that.inUse = false;
                    _that.callback(new Date().getTime() - _that.start);
                }
            };
            this.img.src = ip;
            this.timer = setTimeout(function () {
                if (_that.inUse) {
                    _that.inUse = false;
                    _that.callback('request timeout');
                }
            }, 2000);
        }
    }
    getSetup() {
        if (Meteor.isDevelopment)
            return "Development";
        if (Meteor.isProduction)
            return "Production";
        if (Meteor.isTest)
            return "Test";
        if (Meteor.isAppTest)
            return "App Test";
        return "N/A";
    }
    getLocationByIp(callback) {
        if (Meteor.isClient) {
            //$.getJSON('//freegeoip.net/json/', (data) => {
            $.getJSON('//geoip.nekudo.com/api', (data) => {
                if (data) {
                    let temp = {
                        coords: {
                            latitude: data.location.latitude,
                            longitude: data.location.longitude
                        }
                    };
                    if (callback) {
                        callback(temp)
                    }
                }
            });
        }
    }
    getAddressByLocation(latitude, longitude, callback) {
        let key = Meteor.settings.public.google.apiKey;
        if (Meteor.isClient) {
            if (key) {
                $.getJSON(`https://maps.googleapis.com/maps/api/geocode/json?&latlng=${latitude},${longitude}&key=${key}`, (data) => {
                    if (data && data.results && data.results.length > 0) {
                        callback(data.results[0].formatted_address);
                    }
                });
            } else if (callback)
                callback();
        } else if (Meteor.isServer) {
            let key = Meteor.settings.public.google.apiKey;
            if (key) {
                try {
                    let result = HTTP.call("GET", `https://maps.googleapis.com/maps/api/geocode/json?&latlng=${latitude},${longitude}&key=${key}`, { timeout: 3000 });
                    if (result && result.statusCode == 200 && result.data.status == "OK") {
                        if (callback)
                            callback.call(this, result.data);
                    } else {
                        showDebug(`Fail to geocode location lat:${lat} & lng:${lng}. err:`, result); // TODO: get actual error
                    }
                } catch (err) {
                    showError(`Fail to geocode location lat:${lat} & lng:${lng}. err:`, err);
                }
            } else if (callback)
                callback();
        }
    }
    getRoutingInfo(number, callback) {
        if (Meteor.isClient) {
            $.ajax({
                url: "https://www.routingnumbers.info/api/name.json?rn=" + number,
                dataType: 'jsonp',
                success: (data) => {
                    if (callback) {
                        if (data.code == 200)
                            callback(data.name);
                        else
                            callback(false);
                    }
                }
            });
        } else if (Meteor.isServer) {
            let url = "https://www.routingnumbers.info/api/name.json?rn=" + number;
            try {
                let result = HTTP.call("GET", url, { timeout: 3000 });
                if (result && result.statusCode == 200) {
                    callback(result.data.name);
                } else {
                    showDebug(`getRoutingInfo[${number}]. err:`, result); // TODO: get actual error
                    callback(false);
                }
            } catch (err) {
                showError(`getRoutingInfo[${number}]. err:`, err);
                callback(false);
            }
        }
    }
    getCurrentLocation(callback) {
        if (Meteor.isClient) {
            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(callback, () => {
                    this.getLocationByIp(callback);
                });
            } else {
                console.error("Geolocation is not supported by this browser.");
                if (callback)
                    this.getLocationByIp(callback);
            }
        }
    }
    isUrl(str) {
        let regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (regexp.test(str))
            return true;
        return false;
    }
    permutator = (inputArr) => {
        let result = [];
        const permute = (arr, m = []) => {
            if (arr.length === 0) {
                result.push(m)
            } else {
                for (let i = 0; i < arr.length; i++) {
                    let curr = arr.slice();
                    let next = curr.splice(i, 1);
                    permute(curr.slice(), m.concat(next))
                }
            }
        }
        permute(inputArr)
        return result;
    }
    init_genrand(s) {
        this.mt[0] = s & 0xffffffff;
        for (this.mti = 1; this.mti < 645; this.mti++) {
            this.mt[this.mti] =
                (1812433253 * (this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >> 30)) + this.mti);
            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect   */
            /* only MSBs of the array this.mt[].                        */
            /* 2002/01/09 modified by Makoto Matsumoto             */
            this.mt[this.mti] &= 0xffffffff;
            /* for >32 bit machines */
        }
    }
    trueRand() {
        var UPPER_MASK = 0x80000000;
        var LOWER_MASK = 0x7fffffff;
        var y;
        var N = 624;
        var mag01 = [0x0, 2567483615];
        var M = 397;
        /* mag01[x] = x * MATRIX_A  for x=0,1 */

        if (this.mti >= N) { /* generate N words at one time */
            var kk;

            if (this.mti == N + 1)   /* if init_genrand() has not been called, */
                this.init_genrand(5489); /* a default initial seed is used */

            for (kk = 0; kk < N - M; kk++) {
                y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
                this.mt[kk] = this.mt[kk + M] ^ (y >> 1) ^ mag01[y & 0x1];
            }
            for (; kk < N - 1; kk++) {
                y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
                this.mt[kk] = this.mt[kk + (M - N)] ^ (y >> 1) ^ mag01[y & 0x1];
            }
            y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
            this.mt[N - 1] = this.mt[M - 1] ^ (y >> 1) ^ mag01[y & 0x1];

            this.mti = 0;
        }

        y = this.mt[this.mti++];

        /* Tempering */
        y ^= (y >> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >> 18);

        return y >> 1;
    }
    b64ToUint6(nChr) {
        return nChr > 64 && nChr < 91 ?
            nChr - 65
            : nChr > 96 && nChr < 123 ?
                nChr - 71
                : nChr > 47 && nChr < 58 ?
                    nChr + 4
                    : nChr === 43 ?
                        62
                        : nChr === 47 ?
                            63
                            :
                            0;
    }
    base64ToBytes(sBase64, nBlocksSize) {
        var
            sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
            nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
        let aBBytes = new ArrayBuffer(nOutLen);
        let taBytes = new Uint8Array(aBBytes);

        for (let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                }
                nUint24 = 0;
            }
        }
        return aBBytes;
    }
    uint6ToB64(nUint6) {
        return nUint6 < 26 ?
            nUint6 + 65
            : nUint6 < 52 ?
                nUint6 + 71
                : nUint6 < 62 ?
                    nUint6 - 4
                    : nUint6 === 62 ?
                        43
                        : nUint6 === 63 ?
                            47
                            :
                            65;
    }
    bytesToBase64(aBytes) {
        let nMod3, sB64Enc = "";
        for (let nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(
                    this.uint6ToB64(nUint24 >>> 18 & 63),
                    this.uint6ToB64(nUint24 >>> 12 & 63),
                    this.uint6ToB64(nUint24 >>> 6 & 63),
                    this.uint6ToB64(nUint24 & 63)
                );
                nUint24 = 0;
            }
        }
        return sB64Enc.replace(/A(?=A$|$)/g, "=");
    }
    isBase64(str) {
        const notBase64 = /[^A-Z0-9+\/=]/i;
        const len = str.length;
        if (!len || len % 4 !== 0 || notBase64.test(str)) {
            return false;
        }
        const firstPaddingChar = str.indexOf('=');
        return firstPaddingChar === -1 ||
            firstPaddingChar === len - 1 ||
            (firstPaddingChar === len - 2 && str[len - 1] === '=');
    }
    getTimeZone(number, callback) {
        let check = this.numberValidator(number);
        if (check.isValid) {
            const timeZoneCheck = new PhoneTimeZone(check.e164Format);
            timeZoneCheck.getLocalInfo({ military: false, zone_display: 'area' }, function (result) {
                if (callback)
                    callback(result || null);
            });
            return true;
        }
        if (callback)
            callback(null);
        return false;
    }
    extendObject(obj, src) {
        for (let key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
    }
    getWhatsAppQr(link, callback) {
        if (Meteor.isClient) {
            $.getJSON(link, (data) => {
                if (data) {
                    let temp = {
                        src: data.code,
                        loggedIn: data.loggedIn
                    };
                    if (callback) {
                        callback(temp)
                    }
                }
            });
        }
    }
    getByteSize(text) {
        if (Meteor.isClient)
            return new Blob([text]).size;
        else
            return Buffer.from(text).length;
    }

    /**
     * 
     * @param {Number} duration - in seconds 
     * @param {Function} toDelay  - function to run after the delay
     */
    delayFunction(duration, toDelay) {
        clearTimeout(this.delay);
        this.delay = setTimeout(() => {
            toDelay();
        }, duration * 1000);
    }

    /**
     * 
     * @param {Number} seconds - seconds to convert to days, hours, minute, and seconds
     * @returns {String}
     */
    secondsToDhms(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor(seconds % (3600 * 24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);

        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    errorMsg(error) {
        return error?.message ? error.message : error
    }
}
export default Util = new Utilities();
