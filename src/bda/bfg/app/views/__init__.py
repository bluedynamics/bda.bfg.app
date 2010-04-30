import yafowil.webob
import yafowil.loader
from webob import Response
from webob.exc import HTTPUnauthorized
from zope.interface import Interface
from zope.component import queryUtility, getUtilitiesFor
from repoze.bfg.interfaces import IResponseFactory
from repoze.bfg.view import static
from repoze.bfg.view import bfg_view
from bda.bfg.tile import (
    render_template_to_response,
    render_tile,
)
from bda.bfg.app.views.utils import authenticated

# static resources
static_view = static('static')

# dynamic css hooking
class ICSSResource(Interface):
    """An ICSSResource implemantation is registered as utility.
    """
    
    def __call__():
        """Return CSS rules. The output is appended to ``bda.bfg.app.css``.
        """

def render_default_main_template(model, request, contenttilename='content'):
    """Renders main template and return response object.
    
    As main content the tile with name contenttilename is rendered.
    """
    return render_template_to_response('bda.bfg.app.views:templates/main.pt',
                                       request=request,
                                       model=model,
                                       contenttilename=contenttilename,
                                       project='BDA DB Backend')

@bfg_view(name='bda.bfg.app.css')
def bda_bfg_app_css(model, request):
    """Render custom CSS rules.
    
    XXX: caching
    """
    css = '/* CSS Custom rules */'
    for name, util in getUtilitiesFor(ICSSResource):
        css = """%(origin)s
        
        /* %(name)s */
        %(value)s
        """ % {
            'origin': css,
            'name': name,
            'value': util(),
        }
    response_factory = queryUtility(IResponseFactory, default=Response)
    response = response_factory(css)
    response.content_type = 'text/css';
    return response

@bfg_view('logout')
def logout(context, request):
    return HTTPUnauthorized(headers=[('Location', request.application_url)])