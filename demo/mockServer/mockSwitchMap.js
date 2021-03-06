module.exports = {
  share: [
    {
      name: 'shareData1',
      desc: '共享数据1',
      selections: [
        {
          name: '无羊',
          value: `[
            sheep [ @none ]
          ]`
        },
        {
          name: '一只羊',
          value: `[
            sheep [ @one ]
          ]`
        },
        {
          name: '很多羊',
          value: `[
            sheep [ @lots ]
          ]`
        },
      ]
    }
  ],

  api: [
    // 主页-hello 用到了运行时控制success和error
    {
      url: '/api/kitty',
      desc: 'Hello Kitty',
      selections: [
        {
          name: '成功',
          value: `[
            result [ @success ],
            @good
          ]`
        },
        {
          name: '失败',
          value: `[
            result [ @error ],
            @bad
          ]`
        }
      ]
    },
  
    {
      url: '/api/user',
      desc: '获取用户信息',
      selections: [
        {
          name: '普通用户-Jack',
          value: `[
            result [ @Jack ]
          ]`
        },
        {
          name: '会员-Pony',
          value: `[
            result [ @Pony ]
          ]`
        },
        {
          name: '大会员-Jimmy',
          value: `[
            result [ @Jimmy ]
          ]`
        },
        {
          name: '超级会员-Susan',
          value: `[
            result [ @Susan ]
          ]`
        },
        {
          name: '土豪会员-Joy(rich)',
          value: `[
            result [ @Joy [ level [ @rich ] ] ]
          ]`
        },
        {
          name: '普通用户-Joy(poor)',
          value: `[
            result [ @Joy  ]
          ]`
        },
      ]
    }
  ]
}