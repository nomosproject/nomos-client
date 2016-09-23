const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

function throttle (ms) {
  return async (ctx, next) => {
    await pause(ms)
    ctx = await next(ctx)
    return ctx
  }
}

module.exports = { throttle }
