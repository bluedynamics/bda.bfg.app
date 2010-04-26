import yafowil.common
import yafowil.compound
from yafowil.base import factory

from repoze import formapi
from bda.bfg.tile import tile
from bda.bfg.app.views.utils import authenticated
from bda.bfg.app.views.common import Form

from bda.bfg.app.views.common import YafowilForm

class LoginForm(YafowilForm):
    
    @property
    def form(self):
        form = factory(u'form',
                       name='loginform',
                       properties={'action': self.nodeurl})
        form['loginfields'] = factory('fieldset')
        form['loginfields']['errfield'] = factory('errorfield', properties={})
        form['loginfields']['errfield']['user'] = factory('user', properties={'required': 1})

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