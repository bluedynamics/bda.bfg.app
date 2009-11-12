/*
* Copyright (c) 2005-2007
* Authors: KSS Project Contributors (see doc/CREDITS.txt)
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License version 2 as published
* by the Free Software Foundation.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
* 02111-1307, USA.
*/

/* Request manager */

kukit.rm = new function() {   /// MODULE START

var rm = this;


/* Generation of an integer uid on request objects
*/

rm._rid = 0;

/*
* class _RequestItem
*
* Request item. Encapsulates the sendout function and data.
*/
var _RequestItem = function() {

this.initialize = function(sendHook, url, timeoutHook, timeout, now) {
    if (typeof(now) == 'undefined') {
        now = (new Date()).valueOf();
    }
    this.sent = now;
    this.expire = now + timeout;
    this.handled = false;
    this.sendHook = sendHook;
    this.url = url;
    this.timeoutHook = timeoutHook;
    // Generate a RID. Due to timeouting, we have enough
    // of these for not to overlap ever.
    this.rid = rm._rid;
    rm._rid ++;
    if (rm._rid >= 10000000000) {
        rm._rid = 0;
    }
};

this.callTimeoutHook = function() {
    // Calls the timeout hook for this item
    if (this.timeoutHook) {
        this.timeoutHook(this);
    }
};

this.setReceivedCallback = function(func) {
    // Sets the received callback function. It will be
    // called with the item as first parameter.
    this._receivedCallback = func;
};

this.receivedResult = function(now) {
    // This is called when the result response has arrived. It
    // returns a booolean value, if this is false, the caller
    // must give up processing the result that has been timed
    // out earlier.
    var result = this._receivedCallback(this, now);
    this._receivedCallback = null;
    return result;
}; 
this.initialize.apply(this, arguments);
};

rm.TestRequestItem = function() {
kukit.logWarning('Use class [rm.TestRequestItem] only in tests !');
this.initialize.apply(this, arguments);
};
rm.TestRequestItem.prototype = new _RequestItem();

/* 
* class _TimerQueue
*
* the send queue. This handles timeouts, and executes
* a callback for timed out items.
* Callback is called with the request item as parameter.
*/

var _TimerQueue = function() {

this.initialize = function(callback) {
    this.callback = callback;
    this.queue = new kukit.ut.SortedQueue(this._sentSort);
    this.count = 0;
};

this._sentSort = function(a, b) {
    // sorting of the sent queue, by expiration
    if (a.expire < b.expire) return -1;
    else if (a.expire > b.expire) return +1;
    else return 0;
};

this.push = function(item) {
    // push a given slot
    this.queue.push(item);
    this.count += 1;
};

this.pop = function(item) {
    // pop a given slot, return true if it was valid,
    // return false if it was already handled by timeout.
    // An object can be popped more times!
    if (typeof(item) == 'undefined' || item.handled) {
        return false;
    } else {
        item.handled = true;
        this.count -= 1;
        return true;
    }
};

this.handleExpiration = function(now) {
    if (typeof(now) == 'undefined') {
        now = (new Date()).valueOf();
    }
    var to;
    for (to=0; to<this.queue.size(); to++) {
        var item = this.queue.get(to);
        if (! item.handled) {
            if (item.expire > now) {
                break;
            } else {
                // call the callback for this element
                item.handled = true;
                this.count -= 1;
                this.callback(item);
            }
        }
    }
    // remove the elements from the queue
    this.queue.popn(to);
    // Returns when the next element will expire.
    var front = this.queue.front();
    var next_expire = null;
    if (front) {
        next_expire = front.expire;
    }
    return next_expire;
};
this.initialize.apply(this, arguments);
};

rm.TestTimerQueue = function() {
kukit.logWarning('Use class [rm.TestTimerQueue] only in tests !');
this.initialize.apply(this, arguments);
};
rm.TestTimerQueue.prototype = new _TimerQueue();


/* 
* class RequestManager
*/
rm.RequestManager = function () {

this.initialize = function (name, maxNr, schedulerClass, sendingTimeout) {
    // schedulerClass is mainly provided for debugging...
    this.waitingQueue = new kukit.ut.FifoQueue();
    this.sentNr = 0;
    var self = this;
    var timeoutItem = function(item) {
       self.timeoutItem(item);
    };
    this.timerQueue = new _TimerQueue(timeoutItem);
    if (typeof(name) == 'undefined') {
        name = null;
    }
    this.name = name;
    var nameString = '';
    if (name != null) {
        nameString = '[' + name + '] ';
        }
    this.nameString = nameString;
    // max request number
    if (typeof(maxNr) == 'undefined' || maxNr == null) {
        // Default is 4
        maxNr = 4;
    }
    this.maxNr = maxNr;
    // sets the timeout scheduler
    var checkTimeout = function() {
       self.checkTimeout();
    };
    if (typeof(schedulerClass) == 'undefined') {
        schedulerClass = kukit.ut.Scheduler;
    }
    this.timeoutScheduler = new schedulerClass(checkTimeout);
    this.spinnerEvents = {'off': [], 'on': []};
    this.spinnerState = false;
    // sending timeout in millisecs
    if (typeof(sendingTimeout) != 'undefined' && sendingTimeout != null) {
        this.sendingTimeout = sendingTimeout;
    }
};

;;; this.getInfo = function() {
;;;     var msg = '(RQ: ' + this.sentNr + ' OUT, ' + this.waitingQueue.size();
;;;     msg += ' WAI)';
;;;     return msg;
;;; };

;;; this.log = function(txt) {
;;;     var msg = 'RequestManager ' + this.nameString + txt + ' ';
;;;     msg += this.getInfo() + '.';
;;;     kukit.logDebug(msg);
;;; };

this.setSpinnerState = function(newState) {
    if (this.spinnerState != newState) {
        this.spinnerState = newState;
        // Call the registered spinner events for this state
        var events = this.spinnerEvents[newState ? 'on' : 'off'];
        for (var i=0; i<events.length; i++) {
            events[i]();
        }
    }
};

this.pushWaitingRequest = function(item, now) {
    this.waitingQueue.push(item);
    // Set the timeout
    this.checkTimeout(now);
};

this.popWaitingRequest = function() {
    var q = this.waitingQueue;
    // pop handled elements, we don't send them out at all
    while (! q.empty() && q.front().handled) {
        q.pop();
    }
    // return the element, or null if no more waiting!
    if (! q.empty()) {
        return q.pop();
    } else {
        return null;
    }
};

this.pushSentRequest = function(item, now) {
    this.sentNr += 1;
;;; this.log('notifies server ' + item.url + ', rid=' + item.rid);
    // Set the spinner state
    this.setSpinnerState(true);
    // Set the timeout
    this.checkTimeout(now);
    // Wrap up the callback func. It will be called
    // with the item as first parameter.
    var self = this;
    var func = function(item, now) {
        return self.receiveItem(item, now);
    };
    item.setReceivedCallback(func);
    // Call the function
    item.sendHook(item);
};

this.checkTimeout = function(now) {
    var nextWake = this.timerQueue.handleExpiration(now);
    if (nextWake) {
        // To make sure, add 50ms to the nextwake
        nextWake += 50;
        // do the logging
        //var now = (new Date()).valueOf();
        //this.log('Next timeout check in: ' + (nextWake - now));
    } else {
;;;     this.log('suspends checking timeout until the next requests');
        // Set the spinner state
        this.setSpinnerState(false);
    }
    // do the scheduling
    this.timeoutScheduler.setNextWakeAtLeast(nextWake);
};

this.popSentRequest = function(item) {
    var success = this.timerQueue.pop(item);
    // We remove both to be processed, and timed out requests from the queue.
    // This means: possibly more physical requests are out, but this
    // is a better strategy in order not to hog the queue infinitely.
    this.sentNr -= 1;
    return success;
};

this.isSentRequestQueueFull = function() {
    return (this.sentNr >= this.maxNr);
};

this.receivedResult = function(item, now) {
    // called automatically when the result gets processed.
    // Mark that we have one less request out.
    var success = this.popSentRequest(item);
    // Independently of the success, this is the moment when we may
    // want to send out another item.
    var waiting = this.popWaitingRequest();
    if (waiting != null) {
        // see if we can send another request in place of the received one
        // request is waiting, send it.
;;;     var msg = 'dequeues server notification at [' + waiting.url;
;;;     msg += '], rid [' + waiting.rid + '].';
;;;     this.log(msg);
        this.pushSentRequest(waiting, now);
    } else {
    //    this.log("Request queue empty.");
        // Set the spinner state
        this.setSpinnerState(false);
    }
    return success;
};


this.receiveItem = function(item, now) {
    // calls result processing
    var success = this.receivedResult(item, now);
;;; if (success) {
;;;     this.log('received result with rid [' + item.rid + ']');
;;; } else {
;;;     var msg = 'received timed out result rid [' + item.rid;
;;;     msg += '], to be ignored';
;;;     this.log(msg);
;;; }
    return success;
};

this.timeoutItem = function(item) {
    /* Time out this item. */
;;; this.log('timed out request rid [' + item.rid + ']');
    // Call the timeout hook on the item
    item.callTimeoutHook();
};

/* request manager notification API */

this.notifyServer =
    function(sendHook, url, timeoutHook, timeout, now) {
    // url is only for the logging
    // sendHook is the function that actually sends out the request.
    // sendHook will be called with one parameter: the 'item' array.
    // The sender mechanism must make sure to call item.receivedResult()
    // when it received the response.
    // Based on the return value of receivedResult(), the result processing
    // may go on or must be broken. If the return value is false, the
    // results must NOT be processed: this means that we have already
    // timed out the request by that time.
    // timeoutHook: can specify the timeouthook for this request.
    // Setting it to null
    // disables it. This will be called with the 'item' as a parameter as well.
    if (typeof(timeout) == 'undefined') {
        // Default value of timeout
        timeout = this.sendingTimeout;
    }
    var item = new _RequestItem(sendHook, url, timeoutHook, timeout,
        now);
    // Start timing the item immediately
    this.timerQueue.push(item);
    if (! this.isSentRequestQueueFull()) {
        // can be sent if we are not over the limit.
        this.pushSentRequest(item, now);
    } else {
        this.pushWaitingRequest(item, now);
;;;     var msg = 'queues server notification at [' + item.url;
;;;     msg += '], rid [' + item.rid + ']';
;;;     this.log(msg);
    }
};

this.registerSpinnerEvent = function(func, state) {
    this.spinnerEvents[state ? 'on' : 'off'].push(func);
};
this.initialize.apply(this, arguments);
};

// Default value of sending timeout in ms
rm.RequestManager.prototype.sendingTimeout = 8000;

}();                              /// MODULE END
