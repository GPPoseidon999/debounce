import debounce from './debounce';
function throttle(func, wait, options) {
    let leading = true;
    let trailing = true;
    if (typeof func !== 'function') {
        throw new TypeError('Expected a function');
    }
    // 判断是否是对象
    function isObject(value) {
        const type = typeof value;
        return value != null && (type == 'object' || type == 'function');
    }

    if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
    }

    return debounce(func, wait, {
        leading,
        trailing,
        'maxWait': wait
    });
}
export default throttle;
