from yafowil.base import (
    factory,
    ExtractionError,
)
from bda.bfg.tile import tile
from bda.bfg.app.views.utils import authenticated
from bda.bfg.app.views.common import Form

@tile('loginform', permission="login")
class LoginForm(Form):
    
    @property
    def form(self):
        form = factory(u'form',
                       name='loginform',
                       props={'action': self.nodeurl})
        form['__do_login'] = factory('hidden', value='true')
        form['user'] = factory(
            'field:label:error:text',
            props = {
                'required': 'No username given',
                'label': 'Username',
            })    
        form['password'] = factory(
            'field:label:*credentials:error:password',
            props = {
                'required': 'No password given',
                'label': 'Password',
            },
            custom = {
                'credentials': ([self.authenticated], [], [], []),
            })
        form['login'] = factory(
            'submit',
            props = {
                'action': 'login',
                'expression': True,
                'handler': None,
                'next': None,
                'label': 'Login',
            })
        return form
    
    def authenticated(self, widget, data):
        if not authenticated(self.request):
            raise ExtractionError(u'Invalid Credentials')