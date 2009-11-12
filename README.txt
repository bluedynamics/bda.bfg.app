Overview
========

``bda.bfg.app`` provides a common web application stub.

This includes a base web application layout, authentication integration,
application model handling, view helpers and commonly needed UI widgets.

Setup
=====

Application egg
---------------

Create your application egg and make it depend on ``bda.bfg.app``. You must
depend you application as well to your prefered ``repoze.what`` plugin, in our
case this is ``repoze.what.plugins.ini``.

You have to include the package ``bda.bfg.app`` in the ``configure.zcml`` of
your application egg to make sure everything needed to run the framework is
available::

  <configure xmlns="http://namespaces.repoze.org/bfg">
    <include package="bda.bfg.app" />
    ...
  </configure>

Buildout
--------

We use Paster for WSGI deployment and buildout for the application setup,
thus your (self contained) buildout configuration might look like this::

  [buildout]
  extensions = buildout.dumppickedversions
  parts = instance omelette
  eggs-directory = ${buildout:directory}/eggs
  find-links = 
      http://dist.repoze.org/bfg/1.0/
      http://dist.repoze.org/lemonade/dev/ 
  develop = .
        
  [instance]
  recipe = repoze.recipe.egg:scripts
  eggs =
      your.application.egg

  [omelette]
  recipe = collective.recipe.omelette
  eggs = ${instance:eggs}

Authentication and Authorization Configuration
----------------------------------------------

You need to configure ``repoze.who`` and ``repoze.what`` by providing the
corresponding configuration files (locate them inside your egg root).

We configure ``repoze.who`` to use HTTP basic auth via a ``htaccess`` file.
A Plugin that fit our needs for form authentication is shipped with the
``bda.bfg.app`` package.

This is how our ``who.ini`` looks like::

  [plugin:form]
  # identification and challenge
  use = bda.bfg.app.authentication:make_plugin
  login_form_qs = __do_login
  rememberer_name = auth_tkt

  [plugin:auth_tkt]
  # identification
  use = repoze.who.plugins.auth_tkt:make_plugin
  secret = secret
  cookie_name = __ac__
  secure = False
  include_ip = False

  [plugin:htpasswd]
  use = repoze.who.plugins.htpasswd:make_plugin
  # we locate our ``htaccess`` file along with others in ``${EGGROOT}/etc``
  filename = %(here)s/etc/htpasswd
  check_fn = repoze.who.plugins.htpasswd:crypt_check

  [general]
  request_classifier = repoze.who.classifiers:default_request_classifier
  challenge_decider = repoze.who.classifiers:default_challenge_decider
  remote_user_key = REMOTE_USER

  [identifiers]
  plugins =
        form;browser
        auth_tkt

  [authenticators]
  plugins = htpasswd

  [challengers]
  plugins = form
 
 Now we create the ``repoze.what`` configuration, which defines the plugins to
 use for recognizing permissions and groups.
 
 The file ``what.ini`` looks like this for using the ``repoze.what.plugins.ini``
 adapters::
 
  [plugin:ini_group]
  use = repoze.what.plugins.ini:INIGroupAdapter
  filename = %(here)s/etc/groups.ini

  [plugin:ini_permission]
  use = repoze.what.plugins.ini:INIPermissionsAdapter
  filename = %(here)s/etc/permissions.ini

  [what]
  group_adapters = ini_group
  permission_adapters = ini_permission

Read the documentation of ``repoze.what.plugins.ini`` for information about
group and permission configuration via INI files.

Configure the WSGI pipeline
---------------------------

Since we use ``Paster`` to server our application, we have to provide a
configuration for it which wires all our fancy stuff together.

Create a file like ``yourapplication.ini`` inside your egg root which contains
somewhat like this::

  [DEFAULT]
  debug = true

  [server:main]
  use = egg:Paste#http
  host = 0.0.0.0
  port = 8080

  [app:yourapplication]
  use = egg:yourapplication#app
  reload_templates = true
  filter-with = what

  [filter:what]
  use = egg:bda.bfg.app#whatconfig
  config_file = %(here)s/what.ini
  who_config_file = %(here)s/who.ini

  [filter:appstate]
  # this is needed by the application framework and initializes an appstate
  # object for further use inside your application code.
  use = egg:bda.bfg.app#appstate

  [pipeline:main]
  pipeline =
      appstate
      smokesignals

Provide the application model
-----------------------------

We defined the entry point yourapplication#app in our WSGI pipeline config,
thus we have to define this entry point as well in the application egg's
setup.py::

  >>> entry_points = """\
  ... [paste.app_factory]
  ... app = yourapplication.run:app
  ... """

Now we add the file ``run.py`` and define the ``run`` function, which is
responsible to create the application.

  >>> from repoze.bfg.router import make_app
  >>> def app(global_config, **kw):
  ...     from yourapplication.model import get_root
  ...     import yourapplication
  ...     return make_app(get_root, yourapplication, options=kw)

The imported get_root function is responsible to provide the application model
root node. Create the file ``model.py`` which looks like::

  >>> from repoze.bfg.security import Everyone
  >>> from repoze.bfg.security import Allow
  >>> from bda.bfg.app.model import Base  

  >>> class Root(Base):
  ...     __acl__ = [
  ...         (Allow, Everyone, 'view'),
  ...     ]
  ...     factories = {}
       
  >>> root = Root()

  >>> def get_root(environ):
  ...     return root

Provide a content view for your root model node
-----------------------------------------------

To get the application finally up and run, we have to provide a tile
named ``content`` for the root node to be able to render it. Create a file
named ``views.py`` in you application egg and define the root contant tile.
For more information about tiles see ``bda.bfg.tile`` documentation.

  >>> from bda.bfg.tile import registerTile
  >>> from yourapplication.model import Root
  >>> registerTile('content',
                   path='yourapplication:templates/rootview.pt',
                   interface=Root)

Sure you need to create the ``rootview.pt`` template at the pointed location.
This template represents the view for the layout's content area on the
application model root.

Now add the following line to your applications configure.zcml to scan the
available views::

  <scan package=".views" />

Test the setup
--------------

  * Run buildout
  * Start the WSGI pipline like ``./bin/paster serve yourapplication.ini``

You should be able now to browse the application at ``localhost:8080``.

The application Model
=====================

XXX

The Application Layout
======================

Tiles and the application
-------------------------

XXX

Predefined tiles
----------------

XXX

KSS and tiles
-------------

Application Widgets
===================

Writing forms
-------------

XXX

Writing batches
---------------

XXX

Application security
====================

Dealing with ACL's
------------------

XXX