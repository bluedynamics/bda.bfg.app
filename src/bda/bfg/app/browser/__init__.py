import yafowil.webob
import yafowil.loader
import yafowil.widget.datetime
from webob import Response
from webob.exc import HTTPUnauthorized
from zope.interface import Interface
from zope.component import queryUtility, getUtilitiesFor
from repoze.bfg.interfaces import IResponseFactory
from repoze.bfg.view import (
    static,
    bfg_view,
)
from bda.bfg.tile import (
    render_template_to_response,
    render_tile,
)
from bda.bfg.app.browser.utils import (
    authenticated,
    AppUtil,
)

# main template. Overwrite to customize
MAIN_TEMPLATE = 'bda.bfg.app.browser:templates/main.pt'

# static resources
static_view = static('static')

# dynamic css hooking
class ICSSResource(Interface):
    """An ICSSResource implemantation is registered as utility.
    """
    
    def __call__():
        """Return CSS rules. The output is appended to ``bda.bfg.app.css``.
        """

def render_main_template(model, request, contenttilename='content'):
    """Renders main template and return response object.
    
    As main content the tile with name contenttilename is rendered.
    """
    return render_template_to_response(MAIN_TEMPLATE,
                                       request=request,
                                       model=model,
                                       util=AppUtil(),
                                       contenttilename=contenttilename,
                                       project='BDA DB Backend')

@bfg_view(permission='login')
def main(model, request):
    return render_main_template(model, request)

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