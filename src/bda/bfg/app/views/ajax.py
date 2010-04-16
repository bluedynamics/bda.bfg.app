import json
from zope.interface import implements
from zope.interface import Interface
from zope.interface import Attribute
from repoze.bfg.interfaces import IRequest
from repoze.bfg.threadlocal import get_current_registry
from repoze.bfg.view import bfg_view
from bda.bfg.tile import (
    ITile,
    render_tile,
    render_to_response,
)

class IAjaxAction(Interface):
    """Interface for an ajax action.
    
    An implementation of this interface must be registered with
    ``registerAjaxAction``.
    
    You have to provide the ``__init__`` function accepting
    ``model`` and ``request`` as parameters.
    
    You can use the ``AjaxAction`` base class which already implements the
    signature
    """
    tiles = Attribute(u'List of tilenames')

class AjaxAction(object):
    """Abstract IAjaxAction implementation.
    """
    implements(IAjaxAction)
    
    tiles = list()
    
    def __init__(self, model, request):
        self.model = model
        self.request = request

def registerAjaxAction(name, action, interface=None):
    """registers a tile.
    
    ``name``
        identifier of the action (for later lookup).
    
    ``action``
        the ``IAjaxAction`` implementation to register.
    
    ``interface`` 
        Interface or Class of the bfg model the action is registered for.
    """
    registry = get_current_registry()
    registry.registerAdapter(action, [interface, IRequest], IAjaxAction, name, 
                             event=False)

@bfg_view(name='ajaxaction', accept='application/json', renderer='json')
def ajax_action(model, request):
    """Lookup and render tilenames by actionname via JSON.
    
    Request must provide the parameter ``name`` containing the ajax action name.
    """
    registry = get_current_registry()
    name = request.params.get('name')
    action = registry.getMultiAdapter((model, request), IAjaxAction, name=name)
    return action.tiles

@bfg_view(name='ajaxtile', xhr=True)
def ajax_tile(model, request):
    """Render a tile from XMLHTTPRequest by tilename.
    
    Request must provide the parameter ``name`` containing the tile name.
    """
    name = request.params.get('name')
    rendered = render_tile(model, request, name)
    rendered = '<span>%s</span>%s' % (name, rendered)
    return render_to_response(request, rendered)