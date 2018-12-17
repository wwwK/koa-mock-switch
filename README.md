What
---
这是一个前端mock数据、并可以管理返回数据的server。

Why
---
为什么需要`koa-mock-switch`。
目前开发过程中的mock数据方式，主流来说分为：

1.后端mock数据

即，局域环境有一个专门模拟数据用的数据库，然后，后端开发完接口以后，和线上一样地进行增删改查，然后返回给前端数据。

**缺点：**

时间上，前端在需要数据接口的时候，不得不等后端开发完接口以后，才能进行下一步开发。
职责上，即使前端开发页面的效率很高，但是因为最后完成的时间肯定是在后端之后的，如果一个项目进度耽误了，前端的锅是背定了。

2.前端搭建mock数据服务

我们前端，一般都会自己用express或者koa搭建自己的本地前端mock数据服务，市面上也有很多现成的npm可以使用。

**优点:**

前后端并行开发。前后端只需要在开发之前，一起定义好借口规范即可，之后前端按照api文档模拟mock数据，自己躲在小黑屋独自开发，直到最后的联调。

通过对比，我们发现前端搭建mock数据服务的方式无疑是前端开发的首选。
但是，对于传统的前端mock服务，我们做的仅仅只有，前端页面发起请求，mock服务接收请求，根据请求路径寻找对应的mock文件，最后返回给前端。
相信大多公司也是这么干的。

那它有什么不足呢？

考虑一下以下场景：

如果我们想要返回不同的mock数据，开发者不得不手动的修改mock数据源文件，每次注释，解注释。
状态少还可以，比如一个接口，`成功`或`失败`，在界面的显示需要不同，因此，我们就需要写完两组模拟数据，并注释一组比如`失败`，等到需要用`失败`的时候，解注释`失败`，注释`成功`。
如果状态多呢？比如一个用户信息接口，用户分为企业用户和个人用户，然后，企业用户有四种状态：未实名、实名中、已实名、实名失败。默认模拟数据为**企业用户->已实名**，这个时候，我们想要测测所有的情况，那就得做7次注释加解注释的操作。
版本迭代了，已实名还有分：初级会员、中级会员、高级会员、超级会员。
<img src="https://github.com/CodeLittlePrince/ImagesForGithub/blob/master/koa-mock-switch-1.jpg" width="200" />

如果状态更多呢？
<img src="https://github.com/CodeLittlePrince/ImagesForGithub/blob/master/koa-mock-switch-2.png" width="200" />