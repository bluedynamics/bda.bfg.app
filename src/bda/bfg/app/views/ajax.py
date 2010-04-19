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

class IAjaxTiles(Interface):
    """Interface for ajax tiles definition.
    
    An implementation of this interface must be registered with
    ``registerAjaxTiles``.
    
    You have to provide the ``__init__`` function accepting
    ``model`` and ``request`` as parameters.
    
    You can use the ``AjaxTiles`` base class which already implements the
    signature.
    """
    tiles = Attribute(u'List of tilenames')

class AjaxTiles(object):
    """Abstract IAjaxTiles implementation.
    """
    implements(IAjaxTiles)
    
    tiles = list()
    
    def __init__(self, model, request):
        self.model = model
        self.request = request

def registerAjaxTiles(name, action, interface=None):
    """registers ajax tiles.
    
    ``name``
        identifier of the action (for later lookup).
    
    ``action``
        the ``IAjaxTiles`` implementation to register.
    
    ``interface`` 
        Interface or Class of the bfg model the action is registered for.
    """
    registry = get_current_registry()
    registry.registerAdapter(action, [interface, IRequest], IAjaxTiles, name, 
                             event=False)

@bfg_view(name='ajaxtiles', accept='application/json', renderer='json')
def ajax_tiles(model, request):
    """Lookup and return tilenames by tiles action via JSON.
    
    Request must provide the parameter ``name`` containing the ajax action name.
    """
    registry = get_current_registry()
    name = request.params.get('name')
    action = registry.getMultiAdapter((model, request), IAjaxTiles, name=name)
    return action.tiles

@bfg_view(name='ajaxtile', accept='application/json', renderer='json')
def ajax_tile(model, request):
    """Render a tile by tilename via JSON.
    
    Request must provide the parameter ``name`` containing the tile name.
    """
    name = request.params.get('name')
    rendered = render_tile(model, request, name)
    return [name, rendered]