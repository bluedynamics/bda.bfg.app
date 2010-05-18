import yafowil.webob
import yafowil.loader
import yafowil.widget.datetime
from webob.exc import HTTPUnauthorized
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

# append to this list additional relative css file URL's
ADDITIONAL_CSS = []

# static resources
static_view = static('static')

def render_main_template(model, request, contenttilename='content'):
    """Renders main template and return response object.
    
    As main content the tile with name contenttilename is rendered.
    """
    apputil = AppUtil()
    print ADDITIONAL_CSS
    apputil.additional_css = ADDITIONAL_CSS
    return render_template_to_response(MAIN_TEMPLATE,
                                       request=request,
                                       model=model,
                                       util=apputil,
                                       contenttilename=contenttilename,
                                       project='BDA DB Backend')

@bfg_view(permission='login')
def main(model, request):
    return render_main_template(model, request)

@bfg_view('logout')
def logout(context, request):
    return HTTPUnauthorized(headers=[('Location', request.application_url)])