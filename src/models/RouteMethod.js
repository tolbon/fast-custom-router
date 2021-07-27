import '../__typesdef__'
import { ACCEPTED_METHODS, HTTP_RESPONSE_CODE, HTTP_DEFAULT_RESPONSE_CODE } from '../__constants__'

import { join } from 'path'
import Express from 'express'

import ControllerNotFound from '../errors/ControllerNotFound'
import InvalidArgument from '../errors/InvalidArgument'

import RouteParameter from './RouteParameter'
import RouterElementMiddleware from './RouterElementMiddleware'

/** Route method of a Route. */
export default class RouteMethod extends RouterElementMiddleware {
  /**
   * Intanciate RouteMethod object.
   *
   * @param {RequestMethod} method Route method
   * @param {RouteMethodObject} config Route configuration
   */
  constructor(method, config) {
    super(RouteMethod, ['controller', 'response_code', 'body'], config)

    this.name = String(method)
    this.controller_name = config.controller
    this.controller = undefined
    this.response_code = undefined
    this.body = []

    this.__parseMethod(method)
    this.__parseControllerName(config.controller)
    this.__parseResponseCode(config.response_code)
    this.__parseBody(config.body)
  }

  /**
   * Parse method name.
   *
   * @param {string} method HTTP method
   */
  __parseMethod(method) {
    const method_name = String(method).toUpperCase()
    if (ACCEPTED_METHODS.indexOf(method_name) === -1) {
      throw new InvalidArgument(`Router does not provide "${method_name}" method`)
    }
  }

  /**
   * Parse controller name.
   *
   * @param {string} controller Controller name
   */
  __parseControllerName(controller) {
    if (!controller) {
      throw new InvalidArgument(`${this.name}.controller=${controller} is undefined.`)
    }
  }

  /**
   * Parse HTTP response code for success controller response.
   *
   * @param {number} code Default HTTP response code
   */
  __parseResponseCode(code) {
    this.response_code = HTTP_DEFAULT_RESPONSE_CODE
    if (code) {
      if (HTTP_RESPONSE_CODE.indexOf(code) === -1) {
        throw new InvalidArgument(`${code} is not a valid HTTP response code.`)
      }
      this.response_code = code
    }
  }

  /**
   * Parse body arguments.
   *
   * @param {{ string: { type: string; default_value: any } }} body Body arguments
   */
  __parseBody(body) {
    if (body) {
      if (Array.isArray(body) || !(body instanceof Object)) {
        throw new InvalidArgument(`${this.name}.body=${body} is not an dictionnary.`)
      }
      this.body = Object.keys(body).map(key => {
        return new RouteParameter(key, body[key])
      })
    }
  }

  /**
   * Load controller from name and parser configuration.
   *
   * @param {string} controllerDir Controller directory
   */
  async __loadController(controllerDir) {
    const controllerPath = join(controllerDir, this.controller_name + '.js')
    try {
      const module = await import(controllerPath)
      this.controller = module.default
    } catch (error) {
      throw new ControllerNotFound(controllerPath)
    }
  }

  /**
   * Get valided query parameters.
   *
   * @param {Express.Request} req Express request
   * @returns {{ any }} Query parameters
   */
  __getQuery(req) {
    // TODO: query params
    return req.params
  }

  /**
   * Get valided body parameters.
   *
   * @param {Express.Request} req Express request
   * @returns {{ any }} Body parameters
   */
  __getBody(req) {
    // TODO: body params
    return req.body
  }

  /**
   * Give route function.
   *
   * @param {Function} controller Route controller
   * @param {number} statusCode HTTP response code
   * @returns {Function} Route function
   */
  __getRoute(controller, statusCode) {
    return async (req, res, next) => {
      const options = {
        query: this.__getQuery(req),
        body: this.__getBody(req),
      }

      try {
        const result = await controller(options)
        res.status(statusCode)
        if (result) {
          res.json(result)
        } else {
          res.send()
        }
      } catch (error) {
        next(error)
      }
    }
  }

  /**
   * Load controller from name and parser configuration.
   *
   * @param {Express.Router} router Express router
   * @param {string} path Middleware path
   * @param {ParserConfig} config Parser configuration
   */
  async load(router, path, config) {
    this.__loadController(config.controller_dir)
    const route = (_, res) => {
      res.status(200).json({ message: 'coucou' })
    }
    await this.__loadPreMiddlewares(router, path, config.middleware_dir)
    router[this.name.toLowerCase()](path, route)
    await this.__loadPostMiddlewares(router, path, config.middleware_dir)
  }
}
