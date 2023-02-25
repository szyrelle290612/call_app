module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 13,
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "no-console": 2,
        "no-undef": "error",
        "no-redeclare": "error",
        "no-shadow": "error",
        "no-empty": 0,
        "no-useless-call": "warn",
        "no-fallthrough": "warn",
        "camelcase": "error",
        "comma-spacing": "warn",
        "quotes": "warn",
        "semi": "error",
        "consistent-return": "warn",
        "arrow-parens": "warn",
        "func-style": "warn",
        "no-class-assign": "warn",
        "getter-return": "error",
        "max-len": ["error", { "code": 150, "ignoreComments": true, "ignorePattern": "^\\s*import\\s.+\\s*from\\s*" }],
        "no-mixed-spaces-and-tabs": "error",
        "no-var": "error",
        "indent-legacy": ["error", 4, { "SwitchCase": 1 }]
    },
    "globals": {
        "module": "readonly",
        "describe": false,
        "Accounts": "readonly",
        "MongoInternals": "readonly",
        "it": false,
        "console": false,
        "confirm": false,
        "alert": false,
        "window": false,
        "document": false,
        "XMLHttpRequest": false,
        "setTimeout": false,
        "$": false,
        "Blob": false,
        "navigator": false,
        "MediaRecorder": false,
        "speechSynthesis": false,
        "Promise": false,
        "Picker": false,
        "Mongo": false,
        "Meteor": false,
        "Assets": false,
        "process": false,
        "atob": false,
        "btoa": false,
        "Buffer": false,
        "FileReader": false,
        "parsePhoneNumber": true,
        "ArrayBuffer": false,
        "Uint8Array": false,
        "clearTimeout": false,
        "Event": false,
        "WebSocket": false,
        "FormData": false,
        "setImmediate": false,
        "require": "readonly",
        "setInterval": false,
        "clearInterval": false
    }
};
