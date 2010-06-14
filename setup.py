from setuptools import setup, find_packages
import sys, os

version = '1.0'
shortdesc = 'Application framework for repoze.bfg.'
longdesc = open(os.path.join(os.path.dirname(__file__), 'README.txt')).read()

setup(name='bda.bfg.app',
      version=version,
      description=shortdesc,
      long_description=longdesc,
      classifiers=[
            'Development Status :: 3 - Alpha',
            'Environment :: Web Environment',
            'Operating System :: OS Independent',
            'Programming Language :: Python', 
            'Topic :: Internet :: WWW/HTTP :: Dynamic Content',        
      ],
      keywords='',
      author='BlueDynamics Alliance',
      author_email='dev@bluedynamics.com',
      url=u'https://svn.bluedynamics.net/svn/internal/mdb',
      license='GNU General Public Licence',
      packages=find_packages('src'),
      package_dir = {'': 'src'},
      namespace_packages=['bda', 'bda.bfg'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'lxml',
          'zodict',
          'repoze.bfg',
          'repoze.bfg.xmlrpc',
          'repoze.what',
          'repoze.what.plugins.ini',
          'repoze.what.plugins.config',          
          'bdajax',
          'bda.bfg.tile',
          'yafowil.webob',
          'yafowil.image',
          'yafowil.jq',
          'yafowil.widget.datetime',
          'yafowil.widget.richtext',
      ],
      extras_require = dict(
          test=[
                'interlude',
          ]
      ),
      tests_require=[
          'interlude',
      ],
      test_suite = "bda.bfg.app.tests.test_app.test_suite",
      entry_points = """
      """
      )