function debounce(func, wait, options) {
    /**
     * 保存一些变量
     * lastArgs: 上一次执行debounced的参数 起一个标记位的作用，用于 trailingEdge 方法中，invokeFunc 后清空
     * lastThis: 上一次的this  
     * maxWait: 最大等待时间
     * result: 函数func执行后的返回值
     * timerId: setTimeout生成的定时器句柄
     * lastCallTime: 上一次调用debounce的时间
     *  */ 
    let lastArgs, lastThis, maxWait, result, timerId, lastCallTime;
    let lastInvokeTime = 0; // 上次执行func的时间
    let leading = false; // 是否响应事件刚开始的回调，第一次执行触发
    let maxing = false; // 是否有最大等待时间
    let trailing = true; // 是否响应事件最后结束的那个回调，最后一次执行触发

    // 没传wait时调用window.requsetAnimationFrame()
    //window.requsetAnimationFrame() 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行
    const useRAF = !wait && wait !== 0 && typeof window.requestAnimationFrame === 'function';

    // 如果传入的func不是函数报错
    if (typeof func !== 'function') {
        throw new TypeError('Expected a function');
    }
    // 判断是否是对象
    function isObject(value) {
        const type = typeof value;
        return value != null && (type == 'object' || type == 'function');
    }

    // wait 转成Number类型
    wait = +wait || 0;
    if (isObject(options)) {
        leading = !!options.leading;
        // 传入参数中是否有maxWait
        maxing = 'maxWait' in options;
        // maxWait 设置为 maxWait 和 wait 中最大的 如果maxWait小于wait 那么maxWait没有意义
        maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
    }
    // 执行func
    function invokeFunc(time) {
        // 获取上一次执行debounce的参数
        const args = lastArgs;
        // 获取上一次的this
        const thisArg = lastThis;
        // 重置
        lastArgs = lastThis = undefined;
        // 将func给 result保存 并返回
        result = func.apply(thisArg, args);
        return result;
    }

    // 开始定时器 如果没有wait使用window.requsetAnimationFrame()
    function startTimer(pendingFunc, wait) {
        if (useRAF) {
            window.cancelAnimationFrame(timerId);
            return window.requestAnimationFrame(pendingFunc);
        }
        return setTimeout(pendingFunc, wait);
    }

    // 取消定时器
    function cancelTimer(id) {
        if (useRAF) {
            return window.cancelAnimationFrame(id);
        }
        clearTimeout(id);
    }

    // 连续执行事件首次触发的回调
    function leadingEdge(time) {
        lastInvokeTime = time;
        // 开启定时器，为了事件结束后的那次回调
        timerId = startTimer(timerExpired, wait);
        // 如果配置了leading 执行传入函数func
        return leading ? invokeFunc(time) : result;
    }

    // 计算仍需等待时间
    function remainingWati(time) {
        /**
         * time 当前时间戳
         * lastCallTime上次调用debounce的时间
         * timeSinceLastCall 当前时间距离上一次调用debounce的时间差
         * lastInvokeTime 上次执行func的时间
         * timeSinceLastInvoke 当前时间距离上一次执行func的时间差
         * wait 输入的等待时间
         * timeWaiting 剩余等待时间
         * maxWait 最大等待时间
         * maxing 是否设置了最大等待时间 
         * maxWait - timeSinceLastInvoke距离上次执行func的剩余时间
         * 
         * 逻辑
         * 是否这是了maxing
         * 是(节流) 返回剩余等待时间和距离上次执行func的剩余等待时间中的最小值
         * 否 返回剩余等待时间
         */
        // 当前时间距离上一次调用debounce的时间差
        const timeSinceLastCall = time - lastCallTime;
        // 当前时间距离上一次调用func的时间差
        const timeSinceLastInvoke = time - lastInvokeTime;
        // 剩余等待时间
        const timeWaiting = wait - timeSinceLastCall;
        return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
    }
    // 判断此时是否应该执行func函数
    function shouldInvoke(time) {
        /**
         * time 当前时间戳
         * lastCallTime 上次调用debounce的时间
         * timeSinceLastCall 当前距离上次调用debounce的时间差
         * lastInvokeTime 上一次执行func的时间
         * timeSinceLastInvoke 当前时间距离上一次执行func的时间差
         * wait 输入的等待时间
         * maxWait 最大等待时间，数据来源于options
         * maxing 是否设置了最大等待时间判断依据 maxWait in options
         * 
         * 逻辑
         * lastCallTime === undefined 第一次调用
         * timeSinceLastCall >= wait 超过超时时间wat 处理事件结束后的那次回调
         * timeSinceLastCall < 0  当前时间-上次调用时间小于0 即更改了系统时间
         * maxing && timeSinceLastInvoke >= maxWait 超过最大等待时间
         */
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxing && timeSinceLastInvoke >= maxWait)
        );
    }

    // 定时器回调函数，表示定时结束后的操作
    function timerExpired() {
        const time = Date.now();
        // 需要执行结束后的那次回调，否则重启定时器
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        // 计算剩余时间 重启定时器 保证下一次的末尾触发
        timerId = startTimer(timerExpired, remainingWati(time));
    }
    // 连续执行事件的最后一次回调
    function trailingEdge(time) {
        // 清空定时器
        timerId = undefined;

        /**
         * trailing和lastArgs 两者同时存在
         * lastArgs 标记位置的作用，意味着debounce至少执行过一次
         */
        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }
    // 取消函数延迟执行 清除定时器 清除闭包变量 初始化
    function cancel() {
        if (timerId !== undefined) {
            cancelTimer(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
    }
    // 立即执行func 如果不存在定时器意味着没有触发事件或者事件已经执行完成 此时返回result
    // 如果存在定时器 ，立即执行trailingEdge，执行完清除定时器id句柄， lastArgs和lastThis
    function flush() {
        return timerId === undefined ? result : trailingEdge(Date.now());
    }
    // 获取当前状态，检查当前是否是在计时中，存在定时器id句柄意味着正在计时中
    function pending() {
        return timerId !== undefined;
    }
    // 入口函数 返回此函数
    function debounced(...args) {
        // 当前时间
        const time = Date.now();
        // 判断此时是否应该执行func函数
        const isInvoking = shouldInvoke(time);
        // 赋值给闭包 用于其他函数调用
        lastArgs = args;
        lastThis = this;
        lastCallTime = time;
        // 如果需要执行func函数
        if (isInvoking) {
            /**
             * 无timerId的情况有两种
             * 1.首次调用
             * 2.trailingEdge 执行过函数
             */

            if (timerId === undefined) {
                // 首次执行回调
                return leadingEdge(lastCallTime);
            }
            if (maxing) {
                timerId = startTimer(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait);
        }
        return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    return debounced;
}

export default debounce;
