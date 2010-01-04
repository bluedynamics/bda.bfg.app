import os
from webob import Response
from zope.interface import (
    Interface, 
    Attribute, 
    implements
)
from zope.component import (
    queryUtility, 
    getUtilitiesFor, 
    getMultiAdapter
)
from repoze.bfg.interfaces import IResponseFactory
from repoze.bfg.interfaces import IRequest
from repoze.bfg.path import caller_package
from repoze.bfg.view import bfg_view
from repoze.bfg.threadlocal import get_current_registry
from kss.base import KSSCommands
from kss.base.registry import command_set_registry
from bda.bfg.app.appstate import appstate

core_js = [
    'kukit.js',
    'utils.js',
    'errors.js',
    'oper.js',
    'tokenizer.js',
    'providerreg.js',
    'resourcedata.js',
    'kssparser.js',
    'eventreg.js',
    'actionreg.js',
    'dom.js',
    'commandreg.js',
    'serveraction.js',
    'requestmanager.js',
    'commandprocessor.js',
    'selectorreg.js',
    'forms.js',
    'plugin.js',
]

def concatenated():
    """Concatinate the Javascript files for kss core.
    """
    basepath = caller_package(level=1).__path__[0]
    scripts = []
    for filename in core_js:
        path = os.path.join(basepath, 'static', 'js', filename)
        f = open(path, 'r')
        scripts.append(f.read())
        f.close()
    return '\n\n'.join(scripts)

def compress_js(js, level='devel'):
    ret = list()
    if level != 'devel':
        return js
    ret = list()
    for line in js.split('\n'):
        if line.find(';;;') != -1:
            whitespaces = line.find(';;;')
            line = ' ' * whitespaces + line[whitespaces + 3:]
        ret.append(line)
    return '\n'.join(ret)
    
@bfg_view(name='kss.js')
def kss_js(model, request):
    """Render the kss related javascripts.
    
    XXX: caching
    """
    response_factory = queryUtility(IResponseFactory, default=Response)
    return response_factory(compress_js(concatenated()))

class IKSSResource(Interface):
    """An IKSSResource implemantation is registered as utility.
    """
    
    def __call__():
        """Return KSS rules. The output is appended to ``bda.bfg.app.kss``.
        """

@bfg_view(name='bda.bfg.app.kss')
def bda_bfg_app_kss(model, request):
    """Render kss rules.
    
    XXX: caching
    """
    caller = caller_package(level=1)
    path = os.path.join(caller.__path__[0], 'static', 'bda.bfg.app.kss')
    file = open(path, 'r')
    kss = file.read()
    file.close()
    for name, util in getUtilitiesFor(IKSSResource):
        kss = """%(origin)s
        
        /* %(name)s */
        %(value)s
        """ % {
            'origin': kss,
            'name': name,
            'value': util(),
        }
    response_factory = queryUtility(IResponseFactory, default=Response)
    return response_factory(kss)

@bfg_view(name='ksstile')
def ajaxksstile(model, request):
    """AJAX view for KSS Tiles.
    """
    name = appstate(request).tilename
    renderer = getMultiAdapter((model, request), IKSSTile, name=name)
    return renderer()

class IKSSTile(Interface):
    """Tile renderer interface for KSS requests.
    """
    
    def render():
        """Render something via KSS.
        """

class KSSTile(object):
    """Base implementation. Supposed to be derived from this object and
    registered via the @ksstile decorator, i.e.:
    
      >>> @ksstile('myksstile')
      >>> class MyKSSTile(KSSTile):
      >>>     def render(self):
      >>>          core = self.getCommandSet('core')
      >>>          core.replaceHTML('#someid', self.tile)
    
    This tile is then callable via the 'ksstile' view. The KSS rule for this
    looks like:
    
      a.someselector:click {
          evt-click-preventdefault: True;
          action-server: ksstile;
          ksstile-tilename: myksstile;
          ...
      }
    """
    
    implements(IKSSTile)
    
    def __init__(self, model, request):
        self.model = model
        self.request = request
    
    def render(self):
        raise NotImplementedError(u"Base KSS tile renderer does not implement"
                                   "render()")
    
    def __call__(self):
        self.commands = KSSCommands()
        response_factory = queryUtility(IResponseFactory, default=Response)
        self.render()
        response = response_factory(self.commands.render())
        response.content_type = 'text/xml';
        return response
    
    def getCommandSet(self, name):
        return command_set_registry.get(name)(self.commands)

def registerKSSTile(name, _class, interface=Interface):
    """KSSTile registration function.
    """
    factory = _class
    registry = get_current_registry()
    registry.registerAdapter(factory, [interface, IRequest],
                             IKSSTile, name, event=False)

class ksstile(object):
    """KSSTile registration decorator.
    """
    
    def __init__(self, name, interface=Interface):
        self.name = name        
        self.interface = interface

    def __call__(self, ob):
        registerKSSTile(self.name, ob, interface=self.interface)
        return ob