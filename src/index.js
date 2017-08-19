import flattenObj from 'flatten-obj'

const flatten = flattenObj()

const Debug    = require('debug')
const debug = Debug('test:models:plugins:protect')


const VALID_RULES = 'readable writable'.split(' ')
const DEFAULT_OPTIONS = {
  defaultUnwritable: '_id'.split(' '),
  strictSchema: false,
}


const isObject = item => (typeof item === 'object' && item !== null && !Array.isArray(item))


// Return schema object for subdocuement path
const deepSchema = (schema, path) => path
  .split('.')
  .reduce((schemaCol, prop) => schemaCol.path(prop).schema, schema)


// Returns a function that takes a dot path like 'path.subpath.subsubpath' and
// checks if the schema.path(dotpath) has instance === 'Mixed'.
// If it can't find the path info or the pathInfo.instance !== 'Mixed', removes the last
// component of the path and tries again.
// If at some point it identifies a pathInfo.instance === 'Mixed', returns the identified path
// otherwise returns false
const getMixedChecker = schema => (dotPath) => {
  const components = dotPath.split('.')

  while (components.length) {
    const path = components.join('.')
    const pathInfo = schema.path(path)
    if (pathInfo && pathInfo.instance === 'Mixed') {
      return path
    }
    components.pop()
  }
  // Never found pathInfo or never found a pathInfo with instance = 'Mixed'
  return false
}


// Returns a function that takes a path and a persona and returns true if the
// path received is writable by said persona acording to the writable rule.
// A path is writable by default. Returns false if:
// - rules[path].writable === false
// - rules[path].writable is an array and does not contain persona
// - options.strictSchema === true
const getWritableChecker = (schema, options) => (path, persona) => {
  if (options.defaultUnwritable.includes(path)) {
    return false
  }

  const pathInfo = schema.path(path)

  if (!pathInfo) {
    return !options.strictSchema
  }
  const { protectOptions: { writable = true } = { writable: true } } = pathInfo.options

  if (Array.isArray(writable)) {
    return writable.includes(persona)
  }
  return writable
}

// Returns a function that works on a mongoose document toObject() transform option.
// It hides any non-readable property for the persona passed.
const obscure = persona => (doc, ret) => {
  const obscureRecursive = (obj, prefix) => Object
    .keys(obj)
    .reduce((col, path) => {
      const value = obj[path]
      const dotPath = prefix ? `${prefix}.${path}` : path
      const pathInfo = doc.schema.path(dotPath)

      if (!pathInfo) {
        if (value !== null && !Array.isArray(value) && typeof value === 'object') {
          col[path] = obscureRecursive(value, dotPath)
        } else if (doc.schema.virtual(dotPath)) {
          col[path] = value
        }
      } else {
        const { protectOptions: { readable = true } = { readable: true } } = pathInfo.options
        debug(persona)
        debug(readable)
        debug(Array.isArray(readable) ? readable.includes(persona) : 'not array')
        const pathReadable =
          (Array.isArray(readable) && readable.includes(persona)) ||
          readable === true

        if (pathReadable) {
          debug(`path ${dotPath} is readable: ${pathReadable}... adding`)
          col[path] = value
        }
      }
      return col
    }, {})

  return obscureRecursive(ret)
}


const applyRules = (...params) => {
  const applyRulesRecursive = (rules, schema, prefix) => {
    if (!isObject(rules)) {
      return
    }

    Object.keys(rules).forEach((property) => {
      const path = prefix ? `${prefix}.${property}` : property

      const pathInfo = schema.path(path)
      const propertyRules = rules[property]

      if (!pathInfo) {
        applyRulesRecursive(propertyRules, schema, path)
        return
      }
      Object.keys(propertyRules).forEach((rule) => {
        if (!VALID_RULES.includes(rule)) {
          delete propertyRules[rule]
        }
      })
      pathInfo.options.protectOptions = propertyRules
    })
  }

  return applyRulesRecursive(...params)
}


export default function protectPlugin(modelSchema, { rules, options: opts }) {
  if (rules) {
    applyRules(rules, modelSchema)
  }

  const pluginOptions = Object.assign({}, DEFAULT_OPTIONS, opts)

  /**
   * Return function to
   * @param {object} input - The object that will become an instance of Model
   * @param {object} options - tbd {strict, subdocument}
   */
  modelSchema.statics.getInputFilter = function getInputFilter(options = {}) {
    const { subdocument } = options
    const { schema } = this
    const thisSchema = subdocument
      ? deepSchema(schema, subdocument)
      : schema

    const isMixed = getMixedChecker(thisSchema)
    const isWritable = getWritableChecker(thisSchema, pluginOptions)

    return (body, persona) => {
      const flatBody = flatten(body)

      return Object.keys(flatBody)
        .reduce((col, dotPath) => {
          const mixedPath = isMixed(dotPath)

          if (mixedPath === false) {
            if (isWritable(dotPath, persona)) {
              col[dotPath] = flatBody[dotPath]
            }
          } else if (isWritable(mixedPath, persona)) {
            col[dotPath] = flatBody[dotPath]
          }
          return col
        }, {})
    }
  }

  modelSchema.methods.redact = function redact(options = {}) {
    const { persona } = options
    return this.toObject({
      transform: obscure(persona),
      virtuals: true,
    })
  }
}
