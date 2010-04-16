jQuery(document).ready(function() {
	jQuery('a[ajax\\:target]').tiles();
});
jQuery.fn.tiles = function() {
	jQuery(this).bind('click', function(event) {
		var target = jQuery(this).attr('ajax:target');
		var url = target.substring(0, target.indexOf('#'));
		var action = target.substring(target.indexOf('#') + 1, target.length);
		event.preventDefault();
	});
}