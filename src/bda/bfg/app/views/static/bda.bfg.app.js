jQuery(document).ready(function() {
	jQuery('a[ajax\\:target]').tiles();
});
jQuery.fn.tiles = function() {
	jQuery(this).bind('click', function(event) {
		var url = jQuery(this).attr('ajax:target');
		var action = jQuery(this).attr('ajax:action');
		var params = { name: action };
		var errback = function(request, type) {
			alert(type);
		}
		jQuery.ajax({
			url: url + '/ajaxaction',
			dataType: 'json',
			data: params,
			success: function(data) {
				for (var i = 0; i < data.length; i++) {
					var params = { name: data[i] };
					jQuery.ajax({
			            url: url + '/ajaxtile',
			            dataType: 'json',
			            data: params,
			            success: function(data) {
							var tilename = data[0];
							var single = jQuery('#' + tilename);
							var multiple = jQuery('.' + tilename);
							single.replaceWith(data[1]);
							multiple.replaceWith(data[1]);
                            jQuery('a[ajax\\:target]', single).tiles();
                            jQuery('a[ajax\\:target]', multiple).tiles()
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