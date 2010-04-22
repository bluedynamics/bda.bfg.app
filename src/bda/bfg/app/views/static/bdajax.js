jQuery(document).ready(function() {
	jQuery('#ajax-spinner')
        .hide()
        .ajaxStart(function() {
            jQuery(this).show();
        })
        .ajaxStop(function() {
            jQuery(this).hide();
        })
    ;
	jQuery(document).bdajax();
});

// bind bdajax behaviour to context
jQuery.fn.bdajax = function() {
	jQuery('[ajax\\:bind]', this).each(function() {
		var events = jQuery(this).attr('[ajax\\:bind]');
		jQuery('[ajax\\:event]', this).bind(events, bdajax.event);
		jQuery('[ajax\\:call]', this).bind(events, bdajax.call);
		jQuery('[ajax\\:action]', this).bind(events, bdajax.action);
		jQuery('[ajax\\:actions]', this).bind(events, bdajax.actions);
	});
}

bdajax = {
	
    // Display System message as overlay.
    // @param message: Message to display as String or DOM element.
    message: function(message) {
        jQuery('#ajax-message').overlay({
            expose: {
                color: '#fff',
                loadSpeed: 200
            },
            onBeforeLoad: function() {
                var overlay = this.getOverlay();
                jQuery('.message', overlay).html(message);
            },
            closeOnClick: false,
            api: true
        }).load();
    },
    
    // Display Error message as overlay.
    // @param message: Message to display as String or DOM element.
    error: function(message) {
        jQuery("#ajax-message .message")
            .removeClass('error warning info')
            .addClass('error')
        ;
        bdajax.message(message);
    },
    
    // Display Info message as overlay.
    // @param message: Message to display as String or DOM element.
    info: function(message) {
        jQuery("#ajax-message .message")
            .removeClass('error warning info')
            .addClass('info')
        ;
        bdajax.message(message);
    },
    
    // Display Warning message as overlay.
    // @param message: Message to display as String or DOM element.
    warning: function(message) {
        jQuery("#ajax-message .message")
            .removeClass('error warning info')
            .addClass('warning')
        ;
        bdajax.message(message);
    },
	
	// Strip query from URL if existent and return.
	// @param url: Request URL as string.
	parseurl: function(url) {
        var idx = url.indexOf('?');
        if (idx != -1) {
            url = url.substring(0, idx);
        }
		return url;
	},
	
    // Parse query string from URL if existent and return query parameters as
    // object.
    // @param url: Request URL as string.
	parsequery: function(url) {
		var params = {};
		var idx = url.indexOf('?');
        if (idx != -1) {
            var parameters = url.slice(idx + 1).split('&');
            for (var i = 0;  i < parameters.length; i++) {
                var param = parameters[i].split('=');
                params[param[0]] = param[1];
            }
        }
		return params;
	},
	
	// Parse target definitions from ``ajax:target`` on elem
	// @param target: DOM element with ``ajax:target`` attribute set
	parsetarget: function(elem) {
		var target = jQuery(elem).attr('ajax:target');
		return {
			url: bdajax.parseurl(target),
			params: bdajax.parsequery(target)
		};
	},
	
	// Callback handler for event triggering.
    event: function(event) {
        var target = bdajax.parsetarget(this);
        var attr = jQuery(this).attr('ajax:event');
        var defs = attr.split(' ');
        for (def in defs) {
            def = def.split(':');
            var evt = jQuery.Event(def[0]);
            evt.target = target;
            jQuery(def[1]).trigger(evt);
        }
    },
    
    // Callback handler for javascript function calls.
    call: function(event) {
        var attr = jQuery(this).attr('ajax:call');
        var defs = attr.split(' ');
        for (def in defs) {
            def = def.split(':');
            func = eval(def[0]);
            func(jQuery(def[1]));
        }
    },
    
    // Callback handler for an action binding.
    action: function(event) {
        var target;
        if (event.target) {
            target = config.event.target;
        } else {
            target = bdajax.parsetarget(this);
        }
        var defs = jQuery(this).attr('ajax:action');
        defs = defs.split(':');
        bdajax._action({
            name: defs[0],
            selector: defs[1],
            mode: defs[2],
            url: target.url,
            params: target.params,
        });
        event.preventDefault();
    },
    
    // Callback handler for an actions binding.
    actions: function(event) {
		var target;
        if (event.target) {
            target = config.event.target;
        } else {
            target = bdajax.parsetarget(this);
        }
        var actions = jQuery(this).attr('ajax:actions');
		actions = defs.split(' ');
		for (action in actions) {
			defs = action.split(':');
			bdajax._action({
	            name: defs[0],
	            selector: defs[1],
	            mode: defs[2],
	            url: target.url,
	            params: target.params,
	        });
		}
		event.preventDefault();
    },
	
    // Error messages.
    ajaxerrors: {
        timeout: 'The request has timed out. Pleasae try again.',
        error: 'An error occoured while processing the request. Aborting.',
        parsererror: 'The Response could not be parsed. Aborting.',
        unknown: 'An unknown error occoured while request. Aborting.'
    },
    
    // Get error message.
    // @param status: ``jQuery.ajax`` error callback status
    ajaxerror: function(status) {
        if (status == 'notmodified') { return; }
        if (status == null) { status = 'unknown' }
        return bdajax.ajaxerrors[status];
    },
	
	// Perform an ajax request.
	// @param config: object containing request configuration.
	//     Configuration fields:
	//         success: Callback if request is successful.
	//         url: Request url as string.
	//         params: Query parameters for request as Object (optional). 
	//         type: ``xml``, ``json``, ``script``, or ``html`` (optional).
	//         error: Callback if request fails (optional).
	request: function(config) {
		if (config.url.indexOf('?') != -1) {
			var addparams = config.params;
			config.params = bdajax.parsequery(url);
			url = bdajax.parseurl(url);
			for (var key in addparams) {
                config.params[key] = addparams[key];
            }
		} else {
			if (!config.params) { config.params = {}; }
		}
		if (!config.type) { config.type = 'html'; }
	    if (!config.error) {
	        config.error = function(request, status) {
				var err = bdajax.ajaxerror(status);
				if (err) { bdajax.error(err); }
	        }
	    }
	    jQuery.ajax({
	        url: config.url,
	        dataType: config.type,
	        data: config.params,
	        success: config.success,
	        error: config.error
	    });
	},
	
	// Perform JSON request to server and alter element(s).
	// This function expects as response an array containing a name
	// mapping to class and/or id attributes of the dom element to alter
	// and the html payload which is used as data replacement.
	// @param config: object containing action configuration.
    //     Configuration fields:
    //         name: Action name
    //         selector: result selector
	//         mode: action mode
    //         url: target url,
    //         params: query params,
	_action: function(config) {
        config.params['bdajax.action'] = config.name;
		config.params['bdajax.mode'] = config.mode;
		config.params['bdajax.selector'] = config.selector;
		var error = function(req, status, exception) {
            bdajax.error(exception);
        };
		bdajax.request({
            url: bdajax.parseurl(config.url) + '/ajaxaction',
            type: 'json',
            params: config.params,
            success: function(data) {
				var mode = data.mode;
				var selector = data.selector;
				if (mode == 'replace') {
					jQuery(selector).replaceWith(data.payload);
					jQuery(selector).bdajax();
				} else if (mode == 'inner') {
					jQuery(selector).html(data.payload);
					jQuery(selector).each(function() {
						jQuery(this).bdajax();
					});
				}
            },
            error: error
        });
		config.event.preventDefault();
	}
};