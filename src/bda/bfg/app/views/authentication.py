from repoze import formapi
from bda.bfg.tile import tile
from bda.bfg.app.views.utils import authenticated
#from bda.bfg.app.views import IKSSTile
from bda.bfg.app.views.common import (
    Form, 
    #KSSForm, 
    #KSSMainRenderer,
)

class LoginForm(formapi.Form):
    fields = {
        'login': unicode,
        'password': unicode,
    }
    
    @formapi.validator('login')
    def check_login(self):
        if self.data['login'] == '':
            yield u'No Username given'
        elif not authenticated(self._request):
            yield u'Invalid Credentials'
    
    @formapi.validator('password')
    def check_password(self):
        if self.data['password'] == '':
            yield u'No Password given'
        elif not authenticated(self._request):
            yield u''
    
    @formapi.action('login')
    def login(self, data): pass

@tile('loginform', path='templates/loginform.pt', permission="login")
class LoginFormTile(Form):
    
    @property
    def show(self):
        return not authenticated(self.request)
    
    @property
    def factory(self):
        return LoginForm
    
    @property
    def formname(self):
        return 'loginform'
    
    @property
    def actionnames(self):
        return {
            'login': u'Login',
        }

#@tile('loginform', tile_interface=IKSSTile, permission="login")
#class KSSLoginForm(KSSForm, KSSMainRenderer):
#    
#    formtile = 'loginform'
#    formname = 'loginform'
#    
#    def render(self):
#        if not authenticated(self.request):
#            KSSForm.render(self)
#            return
#        self.renderpartsformodel(self.model.root)