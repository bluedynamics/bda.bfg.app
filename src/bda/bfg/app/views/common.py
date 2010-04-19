from repoze.bfg.security import has_permission
from bda.bfg.tile import (
    tile,
    registerTile,
    Tile,
    render_tile,
    render_template,
)
from bda.bfg.app.views.ajax import (
    AjaxTiles,
    registerAjaxTiles,
)
from bda.bfg.app.views.utils import (
    authenticated,
    nodepath,
    make_query,
    make_url,
    HTMLRenderer,
)

class LayoutAjaxTiles(AjaxTiles):
    
    tiles = [
        'mainmenu',
        'content',
        'navtree',
        'personaltools',
    ]

registerAjaxTiles('layout', LayoutAjaxTiles)

class ProtectedContentTile(Tile):
    """A tile rendering the loginform instead default if user is not
    authenticated.
    """
    
    def __call__(self, model, request):
        if not authenticated(request):
            return render_tile(model, request, 'loginform')
        return Tile.__call__(self, model, request)

@tile('personaltools', 'templates/personaltools.pt', strict=False)
class PersonalTools(Tile):
    """Personal tool tile.
    """

@tile('mainmenu', 'templates/mainmenu.pt', strict=False)
class MainMenu(Tile):
    """Main Menu tile.
    """
    
    @property
    def menuitems(self):
        ret = list()
        count = 0
        path = nodepath(self.model)
        if path:
            curpath = path[0]
        else:
            curpath = ''
        # XXX: self.model.root.values() seem to make troubles if model is
        #      already root.
        for key in self.model.root.keys():
            if not has_permission('view', self.model.root[key], self.request):
                continue
            url = make_url(self.request, path=[key])
            item = dict()
            item['title'] = key
            item['url'] = url
            item['selected'] = curpath == key
            item['first'] = count == 0
            ret.append(item)
            count += 1
        return ret

@tile('navtree', 'templates/navtree.pt', strict=False)
class NavTree(Tile):
    """Navigation tree tile.
    """
    
    def navtreeitem(self, title, url, path):
        item = dict()
        item['title'] = title
        item['url'] = url
        item['selected'] = False
        item['path'] = path
        item['showchildren'] = False
        item['children'] = list()
        return item
    
    def fillchildren(self, model, path, tree):
        if path:
            curpath = path[0]
        else:
            curpath = None
        for key in model:
            node = model[key]
            if not has_permission('view', node, self.request):
                continue
            if not node.in_navtree:
                continue
            title = node.title
            url = make_url(self.request, node=node)
            curnode = curpath == key and True or False
            child = self.navtreeitem(title, url, nodepath(node))
            child['showchildren'] = curnode
            if curnode:
                self.fillchildren(node, path[1:], child)
            selected = False
            if nodepath(self.model) == nodepath(node):
                selected = True
            child['selected'] = selected
            child['showchildren'] = curnode
            tree['children'].append(child)
    
    def navtree(self):
        root = self.navtreeitem(None, None, '')
        model = self.model.root
        path = nodepath(self.model)
        self.fillchildren(model, path, root)
        return root
    
    def rendertree(self, children, level=1):
        return render_template('bda.bfg.app.views:templates/navtree_recue.pt',
                               model=self.model,
                               request=self.request,
                               context=self,
                               children=children,
                               level=level)

class Batch(Tile):
    """An abstract batch tile.
    
    You have to implement 'self.vocab' and you may override 'self.batchrange',
    'self.display' and 'self.batchname'.   
    """
    dummypage = {
        'page': '',
        'current': False,
        'visible': False,
        'url': '',
    }
    
    ellipsis = u'...'
    
    def render(self):
        return render_template('bda.bfg.app.views:templates/batch.pt',
                               request=self.request,
                               model=self.model, context=self)
    
    @property
    def vocab(self):
        return []

    @property
    def display(self):
        return True
    
    @property
    def batchrange(self):
        return 30
    
    @property
    def currentpage(self):
        for page in self.vocab:
            if page['current']:
                return page
        return None
    
    @property
    def firstpage(self):
        firstpage = None
        for page in self.vocab:
            if page['visible']:
                firstpage = page
                break
        if not firstpage and self.vocab:
            firstpage = self.vocab[0]
        return firstpage

    @property
    def lastpage(self):
        lastpage = None
        count = len(self.vocab)
        while count > 0:
            count -= 1
            page = self.vocab[count]
            if page['visible']:
                lastpage = self.vocab[count]
                break
        if not lastpage and self.vocab:
            lastpage = self.vocab[len(self.vocab) - 1]
        return lastpage

    @property
    def prevpage(self):
        prevpage = None
        position = self._getPositionOfCurrentInVocab() - 1
        while position >= 0:
            page = self.vocab[position]
            if page['visible']:
                prevpage = self.vocab[position]
                break
            position -= 1
        if not prevpage and self.vocab:
            prevpage = self.dummypage
        return prevpage

    @property
    def nextpage(self):
        nextpage = self.dummypage
        position = self._getPositionOfCurrentInVocab() + 1
        if position == 0 and self.vocab:
            return nextpage
        if position == 0 and not self.vocab:
            return None
        while position < len(self.vocab):
            page = self.vocab[position]
            if page['visible']:
                nextpage = self.vocab[position]
                break
            position += 1
        return nextpage

    @property
    def leftellipsis(self):
        return self._leftOverDiff < 0 and self.ellipsis or None

    @property
    def rightellipsis(self):
        return self._rightOverDiff < 0 and self.ellipsis or None

    @property
    def pages(self):
        position = self._getPositionOfCurrentInVocab()
        count = len(self.vocab)
        start = max(position - self._siderange - max(self._rightOverDiff, 0), 0)
        end = min(position + self._siderange + max(self._leftOverDiff, 0) + 1,
                  count)
        return self.vocab[start:end]
    
    @property
    def _siderange(self):
        return self.batchrange / 2

    @property
    def _leftOverDiff(self):
        currentPosition = self._getPositionOfCurrentInVocab()
        return self._siderange - currentPosition

    @property
    def _rightOverDiff(self):
        position = self._getPositionOfCurrentInVocab()
        count = len(self.vocab)
        return position + self._siderange - count + 1
    
    def _getPositionOfCurrentInVocab(self):
        #TODO: wildcard handling
        current = self.currentpage
        if current is None:
            return -1
        pointer = 0
        for page in self.vocab:
            if page['page'] == current['page']:
                return pointer
            pointer += 1
        return -1

class Form(Tile, HTMLRenderer):
    """An abstract form tile.
    """
    
    @property
    def factory(self):
        raise NotImplementedError(u"``factory`` property must be provided "
                                   "by deriving object.")
    
    @property
    def formname(self):
        return ''
    
    @property
    def actionnames(self):
        return dict()
    
    @property
    def defaultvalues(self):
        return dict()
    
    @property
    def nexturl(self):
        return self.request.application_url
    
    @property
    def formaction(self):
        return make_url(self.request, node=self.model)
    
    def textinput(self, name):
        value = self.form.data[name]
        payload = self.tag('input',
                           type='text',
                           name=name,
                           value=value)
        return self.wraperror(name, payload)
    
    def passwordinput(self, name):
        payload = self.tag('input',
                           type='password',
                           name=name)
        return self.wraperror(name, payload)
    
    def hiddeninput(self, name, value):
        return self.tag('input', type='hidden', name=name, value=value)
    
    def renderedaction(self, name):
        if name == 'default':
            fieldname = self.formname
        else:
            fieldname = '%s.%s' % (self.formname, name)
        return self.tag('input',
                        type='submit',
                        name=fieldname,
                        _class='formaction',
                        alt='/'.join(nodepath(self.model)),
                        value=self.actionnames.get(name, name))
    
    def wraperror(self, name, payload):
        message = self.form.errors._dict.get(name)
        if not message:
            return self.tag('div',
                            payload,
                            _class='field')
        message = ', '.join(message._messages)
        return self.tag('div',
                        self.tag('div', message, _class='message'),
                        self.tag('div', payload, _class='field'),
                        _class='error')
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        self.succeed = False
        self.processform()
        self.prepare() # XXX maybe remove.
        if not self.show:
            return ''
        if not self.path:
            raise ValueError(u"Could not render form without template.")
        try: # XXX: do not catch exception.
            if self.succeed and False: # XXX alter False with ajax request bool
                return True
            if self.succeed and self.nexturl and True:
                # XXX alter True with ajax request bool
                self.redirect(self.nexturl)
            return render_template(self.path, request=request,
                                   model=model, context=self)
        except Exception, e:
            return u"Error:<br /><pre>%s</pre>" % e
    
    def processform(self):
        params = dict()
        params.update(self.request.params)
        self.form = self.factory(data=self.defaultvalues,
                                 params=params,
                                 prefix=self.formname)
        if self.form.action:
            # XXX: request should be allowed additionally
            # XXX: make model providing on form via annotation
            setattr(self.form, '_request', self.request)
            setattr(self.form, 'model', self.model)
            if self.form.validate():
                self.form()
                self.succeed = True