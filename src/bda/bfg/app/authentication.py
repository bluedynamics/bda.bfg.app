import urllib
from paste.request import parse_formvars
from paste.request import construct_url
from paste.httpexceptions import HTTPFound
from repoze.who.plugins.form import FormPlugin as BasePlugin

class FormPlugin(BasePlugin):
    """Need to provide own implementation here because original plugin tries
    to get the trigger param from the request query string, but it is sent
    as post variable in case of KSS request.
    """
    
    def identify(self, environ):
        query = parse_formvars(environ)
        if query.get(self.login_form_qs): 
            form = parse_formvars(environ)
            from StringIO import StringIO
            environ['wsgi.input'] = StringIO()
            form.update(query)
            try:
                login = form['login']
                password = form['password']
            except KeyError:
                return None
            del query[self.login_form_qs]
            environ['QUERY_STRING'] = urllib.urlencode(query)
            environ['repoze.who.application'] = HTTPFound(
                                                    construct_url(environ))
            credentials = {'login':login, 'password':password}
            max_age = form.get('max_age', None)
            if max_age is not None:
                credentials['max_age'] = max_age
            return credentials
        return None

def make_plugin(login_form_qs='__do_login', rememberer_name=None, form=None):
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
    groups = request.environ['repoze.what.adapters']['groups']['ini_group'].info
    return ['group:%s' % g for g, users in groups.items() if userid in users]

###############################################################################
# borrowed from ``repoze.what.plugins.config`` until package is sane again.
###############################################################################

from ConfigParser import ConfigParser
from StringIO import StringIO
from pkg_resources import EntryPoint
from repoze.who.config import WhoConfig
from repoze.what.middleware import setup_auth

class WhatConfig:
    def __init__(self, here):
        self.here = here
        self.plugins = {}
        self.group_adapters = {}
        self.permission_adapters = {}

    def _makePlugin(self, factory_name, **kw):
        factory = EntryPoint.parse('x=%s' % factory_name).load(False)
        obj = factory(**kw)
        return obj

    def _parsePluginSequence(self, dct, adapter_line):
        for name in adapter_line.split():
            dct[name] = self.plugins[name]

    def parse(self, text):
        if getattr(text, 'readline', None) is None:
            text = StringIO(text)
        cp = ConfigParser(defaults={'here': self.here})
        cp.readfp(text)

        for s_id in [x for x in cp.sections() if x.startswith('plugin:')]:
            plugin_id = s_id[len('plugin:'):]
            options = dict(cp.items(s_id))
            if 'use' in options:
                factory_name = options.pop('use')
                del options['here']
                obj = self._makePlugin(factory_name, **options)
                self.plugins[plugin_id] = obj

        if 'what' in cp.sections():
            what = dict(cp.items('what'))
            if 'group_adapters' in what:
                self._parsePluginSequence(self.group_adapters, 
                                          what['group_adapters'])
            if 'permission_adapters' in what:
                self._parsePluginSequence(self.permission_adapters, 
                                          what['permission_adapters'])

def make_mw_with_what_config(app, global_conf,
                             config_file,
                             who_config_file=''):
    if not who_config_file:
        who_config_file = config_file
    who_parser = WhoConfig(global_conf['here'])
    who_parser.parse(open(who_config_file))
    what_parser = WhatConfig(global_conf['here'])
    what_parser.parse(open(config_file))

    return setup_auth(app,
                      group_adapters=what_parser.group_adapters,
                      permission_adapters=what_parser.permission_adapters,
                      identifiers=who_parser.identifiers,
                      authenticators=who_parser.authenticators,
                      challengers=who_parser.challengers,
                      mdproviders=who_parser.mdproviders,
                      classifier=who_parser.request_classifier,
                      challenge_decider=who_parser.challenge_decider
                     )