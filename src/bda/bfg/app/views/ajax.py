from repoze.bfg.view import bfg_view
from bda.bfg.tile import (
    registerTile,
    render_tile,
)

registerTile('bdajax',
             'bdajax:bdajax.pt',
             permission='login',
             strict=False)

@bfg_view(name='ajaxaction', accept='application/json', renderer='json')
def ajax_tile(model, request):
    """Render an ajax action by name.
    
    Request must provide the parameter ``name`` containing the view or tile
    name.
    """
    # XXX: prefix action name with tile to indicate tile rendering, otherwise
    #      render view
    name = request.params.get('bdajax.action')
    rendered = render_tile(model, request, name)
    return {
        'mode': request.params.get('bdajax.mode'),
        'selector': request.params.get('bdajax.selector'),
        'payload': rendered,
    }