
/* cssQuery drop-in replacement
 * 
 * You need to include this, when you use base2 and you don't
 * want to use cssQuery.
 *
 * When both cssQuery and base2 are present, this code does nothing.
 * When cssQuery is missing at the time this code is loaded,
 * it defines a compatibility cssQuery function that actually reuses 
 * base2 for querying.
 *
 */

// Check that cssQuery is missing originally.
// If it is present, do not redefine it.
if (typeof(window.cssQuery) == 'undefined') {
    // Define the compatibility layer.
    window.cssQuery = function _cssQueryStub(selector, element) {
        // This stub checks which base2 api to use.
        // It only runs once and also returns the result.
        //
        // Base2 legacy version: matchAll has to be used
        // Base2 recent version: querySelectorAll has to be used
        var _USE_BASE2_LEGACY = (typeof(base2.DOM.Document.querySelectorAll) == 'undefined');
        var f;
        if (! _USE_BASE2_LEGACY) {
            f = function(selector, element) {
                return base2.DOM.Document.querySelectorAll(element, selector);
            };
        } else {
            f = function(selector, element) {
                return base2.DOM.Document.matchAll(element, selector);
            };
        }
        // redefine the function with its final version
        window.cssQuery = function cssQuery(selector, element) {
            if (typeof(element) == 'undefined') {
                // if parameter is not given, we need to use document.
                element = document;
            }
            var results = f(selector, element);
            var nodes = [];
            for(var i = 0; i < results.length; i++) {
                nodes.push(results.item(i));
            }
            return nodes;
        };
        // since we are in the stub, we need to use
        // the newly redefined function
        return window.cssQuery(selector, element);
    };
};

