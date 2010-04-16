jQuery(document).ready(function() {
	jQuery('a[ajax\\:target]').tiles();
});
jQuery.fn.tiles = function() {
	jQuery(this).bind('click', function(event) {
		var url = jQuery(this).attr('ajax:target');
		var action = jQuery(this).attr('ajax:action');
		var params = { name: action };
		var idx = url.indexOf('?');
		if (idx != -1) {
			var parameters = url.slice(idx + 1).split('&');
	        for(var i = 0;  i < parameters.length; i++) {
	            var param = parameters[i].split('=');
	            params[param[0]] = param[1];
	        }
	        url = url.substring(0, idx);
		}
		var errback = function(request, type) {
			alert(type);
		}
		jQuery.ajax({
			url: url + '/ajaxaction',
			dataType: 'json',
			data: params,
			success: function(data) {
				for (var i = 0; i < data.length; i++) {
					params.name = data[i];
					jQuery.ajax({
			            url: url + '/ajaxtile',
			            dataType: 'json',
			            data: params,
			            success: function(data) {
							var name = data[0];
							var single = jQuery('#' + name);
							var multiple = jQuery('.' + name);
							single.replaceWith(data[1]);
							multiple.replaceWith(data[1]);
                            jQuery('#' + name + ' a[ajax\\:target]').tiles();
                            jQuery('.' + name + ' a[ajax\\:target]').tiles();
			            },
			            error: errback
			        });
				}
			},
			error: errback
		});
		event.preventDefault();
	});
}