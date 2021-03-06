const send = require('koa-send')
const Koa = require('koa')
const fs = require('fs')
const processMock = require('./processMock')
// 使用router
const Router = require('koa-router')
const Boom = require('boom')
const koaBody = require('koa-body')
const app = new Koa()
const router = new Router()
app.use(router.routes())
app.use(router.allowedMethods({
  throw: true,
  notImplemented: () => new Boom.notImplemented(),
  methodNotAllowed: () => new Boom.methodNotAllowed()
}))
// 使用bodyparser 解析get,post的参数
app.use(koaBody({
  multipart: true
}))

class KoaMockSwitch {
  constructor(config) {
    this.mockRoot = config.root
    this.port = config.port || 7777
    this.mockSwitchMap = config.switchMap || []
    this.apiPrefix = config.apiPrefix || ''
    this.apiSuffix = config.apiSuffix || '.json'
    this.$cache = {} // 设置一个cache，让/mock-switch设置过的数据能够直接给页面
    this.$share = {}
  }

  start() {
    // 给cache里挂载方法
    this._injectMethodToCache()
    // 给share里挂载方法
    this._injectMethodToShare()
    // 初始化共享数据
    this._initMockShareDataByFile()
    // 删除前缀
    app.use(this._removeApiPrefix.bind(this))
    // 通过cache来控制模拟数据的状态切换
    app.use(this._mockDataByCacheMiddware.bind(this))
    // 通过文件来模拟数据
    app.use(this._mockDataByFileMiddware.bind(this))
    // 错误打印
    app.on('error', (err, ctx) => {
      console.log('server error', err, ctx)
    })
    // 注意：这里的端口要和webpack里devServer的端口对应
    this._server = app.listen(this.port)
  }

  stop() {
    this._server && this._server.close(() => {
      process.exit(0)
    })
  }

  _injectMethodToCache() {
    this.$cache.updateByName = (url, selectionName) => {
      const switchData = this.mockSwitchMap.api.find(item => {
        return item.url === url
      })
      
      if (switchData) {
        const selection = switchData.selections.find(item => {
          return item.name === selectionName
        })
        
        if (selection) {
          if (url.startsWith(this.apiPrefix)) {
            url = url.slice(this.apiPrefix.length)
          }
          this.$cache[url].rule = selection.value
        }
      }
    }
  }

  _injectMethodToShare() {
    const shareDataIndexPath = `${this.mockRoot}/$share/index.js`
    
    if (fs.existsSync(shareDataIndexPath)) {
      const shareMockDataHandle = require(shareDataIndexPath)

      this.$share.updateByRule = (shareDataName, mockValueRule) => {
        this.$share.data[shareDataName] = processMock(
          shareMockDataHandle()[shareDataName],
          mockValueRule
        )
      }

      this.$share.updateByName = (shareDataName, selectionName) => {
        const switchData = this.mockSwitchMap.share.find(item => {
          return item.name === shareDataName
        })

        if (switchData) {
          const selection = switchData.selections.find(item => {
            return item.name === selectionName
          })

          if (selection) {
            this.$share.data[shareDataName] = processMock(
              shareMockDataHandle()[shareDataName],
              selection.value
            )
          }
        }
      }
    }
  }

  /**
   * 初始化共享数据
   * 共享数据是可以被所有接口引用的公共数据；
   * 各个接口可以根据判断公共数据的值，根据业务要求返回不同的数据。
   */
  _initMockShareDataByFile() {
    const shareDataIndexPath = `${this.mockRoot}/$share/index.js`

    if (fs.existsSync(shareDataIndexPath)) {
      const shareMockDataHandle = require(shareDataIndexPath)
      const shareMockDataKeys = Object.keys(shareMockDataHandle())

      this.$share.data = {}
      this.mockSwitchMap.share.forEach(item => {
        shareMockDataKeys.forEach(key => {
          if (item.name === key) {
            this.$share.updateByRule(
              key,
              item.selections[0].value
            )
          }
        })
      })
    }
  }

  async _removeApiPrefix(ctx, next) {
    if (ctx.path.startsWith(this.apiPrefix)) {
      ctx.path = ctx.path.slice(this.apiPrefix.length)
    }
    await next()
  }

  async _mockDataByCacheMiddware(ctx, next) {
    // '/mock-switch/list' 是为了让接口管理页面'/mock-switch/'通过配置文件展现数据
    // '/mock-switch/'     是接口管理页面
    // '/mock-switch'      是接口管理页面切换接口时候post的地址
    if (ctx.path.startsWith('/mock-switch/list')) {
      ctx.body = this.mockSwitchMap
    } else if (ctx.path.startsWith('/mock-switch/')) {
      var fileName = ctx.path.substr('/mock-switch/'.length)
      await send(
        ctx,
        './mockManagePage/' + (fileName || 'index.html'),
        { root: __dirname + '/' }
      )
    } else if (ctx.path.startsWith('/mock-switch')) {
      const mockValueRule = ctx.request.body.value
      const type = ctx.request.body.type

      // 如果接口类型为share，则说明要切换的是共享数据
      if (type === 'share') {
        const shareDataIndexPath = `${this.mockRoot}/$share/index.js`

        if (!fs.existsSync(shareDataIndexPath)) {
          ctx.body = 'There is not a $share/index.js file in the folder of mockRoot'
        } else {
          let shareDataName = ctx.request.body.key
  
          this.$share.updateByRule(shareDataName, mockValueRule)
  
          ctx.body = this.$share.data[shareDataName]
        }
      } else {
        let mockFilePath = ctx.request.body.key

        if (mockFilePath.startsWith(this.apiPrefix)) {
          mockFilePath = mockFilePath.slice(this.apiPrefix.length)
        }

        // 模拟数据大管家 - cache
        this.$cache[mockFilePath].rule = mockValueRule

        ctx.body = this.$cache[mockFilePath].rule
      }
    }
    await next()
  }

  async _mockDataByFileMiddware(ctx, next) {
    if (!ctx.path.startsWith('/mock-switch') &&
      ctx.path !== '/' &&
      ctx.path !== '/favicon.ico' &&
      ctx.path.indexOf('hot-update.json') === -1
    ) {
      // 为了寻找对应mock数据的js文件，去除接口后缀
      const path = ctx.path.replace(this.apiSuffix, '')
      // 调用对应的模拟数据
      const apiMockDataHandle = require(`${this.mockRoot}${path}.js`)
      // 返回数据
      const params = ctx.request.method.toLowerCase() === 'get'
        ? ctx.request.query
        : ctx.request.body
      // 如果mock-switch设置过，则从cache中（即$cache）获取目前的rule，然后get下数据即可
      if (this.$cache.hasOwnProperty(path)) {
        ctx.body = processMock(
          apiMockDataHandle({
            params,
            share: this.$share,
            cache: this.$cache,
            switchMap: this.mockSwitchMap,
          }),
          this.$cache[path].rule
        )
      } else {
        // 因为mock-switch对应的mock数据的数据结构的特殊性，需要设置一个默认值
        // 因此遍历mockSwitchMap，如果当前path在mockSwitchMap中
        // 则直接用第一项为默认值
        const switchData = this.mockSwitchMap.api.find(item => {
          let url = item.url
          if (url.startsWith(this.apiPrefix)) {
            url = url.slice(this.apiPrefix.length)
          }

          return url === path
        })

        if (switchData) {
          const rule = switchData.selections[0].value

          this.$cache[path] = {}
          this.$cache[path].data = processMock(
            apiMockDataHandle({
              params,
              share: this.$share,
              cache: this.$cache,
              switchMap: this.mockSwitchMap,
            }),
            rule
          )
          this.$cache[path].rule = rule

          ctx.body = this.$cache[path].data
        } else {
          // 不用mock-switch，正常返回
          ctx.body = apiMockDataHandle({
            params,
            share: this.$share,
            cache: this.$cache,
            switchMap: this.mockSwitchMap,
          })
        }
      }
      await next()
    }
  }
}

module.exports = KoaMockSwitch