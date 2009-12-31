from urlparse import urlsplit
from webob import Request
from zope.interface import implements

# @mcdonc> note that only names with dots in them are considered allowable by 
# wsgi this way, that's why i put foo.bar rather than just foo
APPSTATE = 'bda.appstate'

def appstate(request):
    """Function to query the current appstate.
    
    @param request: WebOb request.
    @return: AppState object.
    """
    return request.environ[APPSTATE]

class AppStateConfig(object):
    """Configuration for the AppStateFactory.
    
    Reserved parameter names are 'ajax' and 'href'.
    """
    
    @property
    def state_members(self):
        """Request parameter whitelist.
        """
        return [
            'tilename',
            'b_page',
            'formaction',
        ]

class AppState(object):
    """Application state object.
    
    This objects holds:
      * All attributes defined in AppStateConfig.state_members
      * 'path' attribute which contains the current relative context path as
        list
      * 'ajax' attribute which indicates the current request has been made
        via XMLHttpRequest.
    """
    
    def __init__(self, **kw):
        for key in kw.keys():
            self.__dict__[key] = kw[key]

class AppStateFactory(object):
    """Factory for the request specific application state.
    
    All request parameter names located at AppStateConfig.state_members are
    read from request and written to the AppState object.
    
    The path part of the site URL is splitted and set to AppState.path as list.
    
    I you call the application via XMLHttpRequest, you must set the
    'kukitTimeStamp' paramter on it with any value to make AppState
    initialization work properly.
    
    If Request is an AJAX request, and the parameter 'href' is found, it is
    used to set the AppState attributes. It must contain the original target
    link, which is parsed as follows:
      * As well The path part of the href url is splitted and set to
        appstate.path as list.
      * The query params of given href are written to appstate if param name is
        contained in AppStateConfig.state_members.
    
    If Request is an AJAX request, and the parameter 'path' is found, this one
    is used to set appstate.path. This overrules the path parsing of href
    attribute.
    """
    
    def __init__(self, application):
        self.application = application

    def __call__(self, environ, start_response):
        """Create the AppState object for request and set it to environ.
        """
        request = Request(environ)
        kw = dict()
        self.config = AppStateConfig()
        for name in self.config.state_members:
            kw[name] = request.params.get(name, '')
        ajax = request.params.get('kukitTimeStamp', None) is not None
        kw['ajax'] = ajax
        kw['path'] = [p for p in request.path.split('/') if p]
        if ajax:
            href = request.params.get('href', None)
            if href is not None:
                self.initializeStateByHyperlink(href, kw)
                kw['path'] = [p for p in urlsplit(href)[2].split('/') if p]
            path = request.params.get('path', None)
            if path is not None:
                kw['path'] = [p for p in path.split('/') if p]
        environ[APPSTATE] = AppState(**kw)
        return self.application(environ, start_response)
    
    def initializeStateByHyperlink(self, href, kw):
        """Used for initializing AJAX queries.
        """
        href = href.replace('&#38;', '&') # safari stuff
        query = urlsplit(href)[3]
        parts = query.split('&')
        for part in parts:
            if not part:
                continue
            param, value = part.split('=')
            if not param in self.config.state_members:
                continue
            if param.find(':') != -1:
                param = param[:param.find(':')]
            kw[param] = value
        
def make_appstate(app, global_conf):
    """WSGI entry point.
    """
    return AppStateFactory(app)