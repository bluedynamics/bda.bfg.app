from repoze.bfg.security import authenticated_userid

def authenticated(request):
    return authenticated_userid(request)

def nodepath(node):
    return [p for p in node.path if p is not None]

def make_query(**kw):
    query = list()
    for name, param in kw.items():
        if param is None:
            continue
        query.append('%s=%s' % (name, param))
    return '?%s' % '&'.join(query)

def make_url(request, path=[], node=None, resource=None, query=None):
    if node is not None:
        path = nodepath(node)
    if resource is not None:
        path.append(resource)
    if not query:
        return '%s/%s' % (request.application_url, '/'.join(path))
    return '%s/%s%s' % (request.application_url, '/'.join(path), query)

class HTMLRenderer(object):
    
    def tag(self, name_, *args, **kw):
        attrlist = list()
        for key, value in kw.items():
            if value is None:
                continue
            if not isinstance(value, unicode):
                value = str(value).decode('utf-8')
            attrlist.append((key, value))
        attrs = u' '.join(u'%s="%s"' % (key.strip('_'), value) \
                                          for key, value in attrlist)
        attrs = attrs and u' %s' % attrs or u''
        arglist = list()
        for arg in args:
            if not isinstance(arg, unicode):
                arg = str(arg).decode('utf-8')
            arglist.append(arg)
        if not arglist:
            return u'<%(name)s%(attrs)s />' % {
                'name': name_,
                'attrs': attrs,
            }
        return u'<%(name)s%(attrs)s>%(value)s</%(name)s>' % {
            'name': name_,
            'attrs': attrs,
            'value': u''.join(c for c in arglist),
        }
    
    def selection(self, vocab_, **kw):
        options = list()
        for term in vocab_:
            optkw = {'value': term[0]}
            if term[2]:
                optkw['selected'] = 'selected'
            option = self.tag('option', term[1], **optkw)
            options.append(option)
        return self.tag('select', *options, **kw)