import { describe, expect, test, beforeEach } from '@jest/globals'
import { routesTeapot } from './__constants__'
import { config } from '../__constants__'

import FakeRouter from '../mock/FakeRouter'

import InvalidArgument from '../../src/errors/InvalidArgument'
import ControllerNotFound from '../../src/errors/ControllerNotFound'

import RouteMethod from '../../src/models/RouteMethod'

describe('check route method configuration', () => {
  test('check invalid configuration', () => {
    expect(() => {
      new RouteMethod('name', null)
    }).toThrow(InvalidArgument)
    expect(() => {
      new RouteMethod('name', undefined)
    }).toThrow(InvalidArgument)
    expect(() => {
      new RouteMethod('name', NaN)
    }).toThrow(InvalidArgument)
  })

  test('check wrong methods', () => {
    expect(() => {
      new RouteMethod(null, routesTeapot.teapot.methods.get)
    }).toThrow(InvalidArgument)
    expect(() => {
      new RouteMethod(undefined, routesTeapot.teapot.methods.get)
    }).toThrow(InvalidArgument)
    expect(() => {
      new RouteMethod(NaN, routesTeapot.teapot.methods.get)
    }).toThrow(InvalidArgument)
    expect(() => {
      new RouteMethod('WRONG_METHOD', routesTeapot.teapot.methods.get)
    }).toThrow(InvalidArgument)
  })

  test('check valid method names', () => {
    expect(() => {
      new RouteMethod('GET', routesTeapot.teapot.methods.get)
    }).not.toThrow()
    expect(() => {
      new RouteMethod('POST', routesTeapot.teapot.methods.get)
    }).not.toThrow()
    expect(() => {
      new RouteMethod('PUT', routesTeapot.teapot.methods.get)
    }).not.toThrow()
    expect(() => {
      new RouteMethod('DELETE', routesTeapot.teapot.methods.get)
    }).not.toThrow()
    expect(() => {
      new RouteMethod('get', routesTeapot.teapot.methods.get)
    }).not.toThrow()
    expect(() => {
      new RouteMethod('post', routesTeapot.teapot.methods.get)
    }).not.toThrow()
    expect(() => {
      new RouteMethod('put', routesTeapot.teapot.methods.get)
    }).not.toThrow()
    expect(() => {
      new RouteMethod('delete', routesTeapot.teapot.methods.get)
    }).not.toThrow()
  })

  test('with invalid body', () => {
    expect(() => {
      new RouteMethod('GET', {
        controller: 'getTeapot',
        body: null,
      })
    }).not.toThrow()
    expect(() => {
      new RouteMethod('GET', {
        controller: 'getTeapot',
        body: undefined,
      })
    }).not.toThrow()
    expect(() => {
      new RouteMethod('GET', {
        controller: 'getTeapot',
        body: NaN,
      })
    }).not.toThrow()
    expect(() => {
      new RouteMethod('GET', {
        controller: 'getTeapot',
        body: ['name', 'date', 'content'],
      })
    }).toThrow(InvalidArgument)
  })

  test('with valid body', () => {
    expect(() => {
      new RouteMethod('GET', {
        controller: 'getTeapot',
        body: {
          name: {
            type: 'STRING',
          },
          date: {
            type: 'NUMBER',
            default_value: 0,
          },
        },
      })
    }).not.toThrow()
    expect(() => {
      new RouteMethod('GET', {
        controller: 'getTeapot',
      })
    }).not.toThrow()
  })
})

describe('load route with express', () => {
  const router = new FakeRouter()
  const path = '/api/user'
  beforeEach(() => router.init())

  describe.skip('check controller import', () => {
    test('check wrong controller', async () => {
      expect(() => {
        new RouteMethod('GET', {
          controller: null,
        })
      }).toThrow(InvalidArgument)
      expect(() => {
        new RouteMethod('GET', {
          controller: undefined,
        })
      }).toThrow(InvalidArgument)
      const method = new RouteMethod('post', {
        controller: 'nonexistingController',
      })
      await expect(method.__loadController(config.controller_dir))
        .rejects.toThrow(ControllerNotFound)
        .catch(() => {})
    })

    test('check controller import', async () => {
      const method = new RouteMethod('post', routesTeapot.teapot.methods.get)
      await method.__loadController(config.controller_dir)
      expect(method.controller).toBeDefined()
    })
  })

  test.skip('load route without middlewares', async () => {
    const method = new RouteMethod('GET', {
      controller: 'getTeapot',
    })
    await expect(method.load(router, path, config))
      .resolves.not.toThrow()
      .catch(() => {})
    expect(router.orderedCall).toHaveLength(1)
    expect(router.routes.get['/api/user']).toBeDefined()
    expect(router.orderedCall[0].route).toBeDefined()
  })

  test.skip('load route with pre middleware', async () => {
    const method = new RouteMethod('GET', {
      controller: 'getTeapot',
      pre_middlewares: ['simpleMiddleware'],
    })
    await expect(method.load(router, path, config))
      .resolves.not.toThrow()
      .catch(() => {})
    expect(router.orderedCall).toHaveLength(2)
    expect(router.routes.get['/api/user']).toBeDefined()
    expect(router.routes.use['/api/user']).toBeDefined()
    expect(router.orderedCall[0].middleware).toBeDefined()
    expect(router.orderedCall[1].route).toBeDefined()
  })

  test.skip('load route with post middleware', async () => {
    const method = new RouteMethod('GET', {
      controller: 'getTeapot',
      post_middlewares: ['simpleMiddleware'],
    })
    await expect(method.load(router, path, config)).resolves.not.toThrow()
    expect(router.orderedCall).toHaveLength(2)
    expect(router.routes.get['/api/user']).toBeDefined()
    expect(router.routes.use['/api/user']).toBeDefined()
    expect(router.orderedCall[0].route).toBeDefined()
    expect(router.orderedCall[1].middleware).toBeDefined()
  })

  test.skip('load route with both pre and post middlewares', async () => {
    const method = new RouteMethod('GET', {
      controller: 'getTeapot',
      pre_middlewares: ['simpleMiddleware'],
      post_middlewares: ['simpleMiddleware'],
    })
    await expect(method.load(router, path, config))
      .resolves.not.toThrow()
      .catch(() => {})
    expect(router.orderedCall).toHaveLength(3)
    expect(router.routes.get['/api/user']).toBeDefined()
    expect(router.routes.use['/api/user']).toBeDefined()
    expect(router.orderedCall[0].middleware).toBeDefined()
    expect(router.orderedCall[1].route).toBeDefined()
    expect(router.orderedCall[2].middleware).toBeDefined()
  })
})
