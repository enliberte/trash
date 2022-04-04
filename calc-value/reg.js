const transformDependencies = [
    'monaco-editor-core',
    'confirmit-calendar',
    'confirmit-date-picker',
    'confirmit-toastr',
    'confirmit-app-header',
    'confirmit-react-utils',
    '@confirmit/react-scheduler',
    'react-redux',
    '@babel\\runtime',
    '@babel/runtime',
    'lodash-es',
    'd3-(\\S*)',
    'internmap'
].join('|');

const regexp = `node_modules/(?!(${transformDependencies})/)`;

const path = 'node_modules/d3-array/'

const result = path.match(regexp)

debugger