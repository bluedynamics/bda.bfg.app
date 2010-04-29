import urllib
from paste.request import parse_formvars
from paste.request import construct_url 
from paste.httpexceptions import HTTPFound 
from repoze.who.interfaces import IAuthenticator
from repoze.who.plugins.form import FormPlugin as BasePlugin

class FormPlugin(BasePlugin):
    """Need to provide own implementation here because original plugin tries
    to get the trigger param from the request query string, but it is sent
    as post variable in case of KSS request.
    """
    
    def identify(self, environ):
        query = parse_formvars(environ)
        if query.get(self.login_form_qs): 
            from StringIO import StringIO
            environ['wsgi.input'] = StringIO()
            try:
                login = query['loginform.user']
                password = query['loginform.password']
            except KeyError:
                return None
            del query[self.login_form_qs]
            environ['QUERY_STRING'] = urllib.urlencode(query)
            credentials = {
                'login': login,
                'password': password,
            }
            
            # XXX: hack, change authentication mechanism as soon as
            #      repoze.who >= 2 takes place
            #
            # repoze.who first calls identify, then the wsgi app and finally
            # does remembering the credentials. this causes the authentication
            # information is not available to the downstream app even if it
            # should (at least imho)
            #
            # so we iterate the available IAuthentication plugins and check
            # if user is already authenticated. if so, change downstream to
            # a HTTPFound instance
            already_authenticated = False
            for plugin in environ['repoze.who.plugins'].values():
                if IAuthenticator.providedBy(plugin):
                    login = credentials['login']
                    if plugin.authenticate(environ, credentials) == login:
                        already_authenticated = True
            if already_authenticated:
                environ['QUERY_STRING'] = ''
                downstream = HTTPFound(construct_url(environ))
                environ['repoze.who.application'] = downstream
            # XXX: end hack
            
            max_age = query.get('max_age', None)
            if max_age is not None:
                credentials['max_age'] = max_age
            return credentials
        return None

def make_plugin(login_form_qs='__do_login',
                rememberer_name=None, form=None):
    if rememberer_name is None:
        raise ValueError(
            'must include rememberer key (name of another IIdentifier plugin)')
    if form is not None:
        form = open(form).read()
    plugin = FormPlugin(login_form_qs, rememberer_name, form)
    return plugin

###############################################################################
# Group resolution callback for authentication policy.
###############################################################################

def groupcallback(userid, request):
    auth_md = request.environ['repoze.who.plugins']['authorization_md']
    groups = auth_md.group_adapters['ini_group']
    return ['group:%s' % g for g, users in groups.info.items() if userid in users]