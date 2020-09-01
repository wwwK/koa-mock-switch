// 不需要mockSwitch的mock数据
module.exports = (params, shareData) => {
  let msg = ''
  if (shareData.shareData1.house === 0) {
    msg = 'Tom! Are you crazy?'
  } else {
    msg = 'Hi Tom! You are so handsome!'
  }

  return {
    message: 'error message',
    params,
    result: {
      msg,
      data: {
        name: 'tom',
        age: 7,
        shareData,
      },
      status: '200'
    }
  }
}