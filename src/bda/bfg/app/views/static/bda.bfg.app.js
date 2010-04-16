jQuery(document).ready(function() {
	jQuery('a[ajax\\:target]').tiles();
});
jQuery.fn.tiles = function() {
	jQuery(this).bind('click', function(event) {
		var target = jQuery(this).attr('ajax:target');
		var url = target.substring(0, target.indexOf('#'));
		var action = target.substring(target.indexOf('#') + 1, target.length);
		var data = { name: action };
		jQuery.ajax({
			url: url + '/ajaxaction',
			dataType: 'json',
			data: data,
			success: function(data) {
				alert(data);
			},
			error: function(request, type) {
				alert(type);
			}
		});
		event.preventDefault();
	});
}