from repoze.bfg.view import bfg_view
from bda.bfg.tile import registerTile
from bda.bfg.app.browser import render_main_template
from bda.bfg.app.browser.layout import ProtectedContentTile

@bfg_view('add', permission='login')
def add(model, request):
    return render_main_template(model, request, contenttilename='add')

registerTile('add',
             'bda.bfg.app:browser/templates/add.pt',
             class_=ProtectedContentTile,
             permission='login',
             strict=False)

@bfg_view('edit', permission='login')
def edit(model, request):
    return render_main_template(model, request, contenttilename='edit')

registerTile('edit',
             'bda.bfg.app:browser/templates/edit.pt',
             class_=ProtectedContentTile,
             permission='login',
             strict=False)