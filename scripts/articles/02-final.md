> 原文（鱼皮 AI 知识库）：[https://ai.codefather.cn/library/1939606874832486401](https://ai.codefather.cn/library/1939606874832486401)
> 同步来源：[https://zhuanlan.zhihu.com/p/1918253363402867753](https://zhuanlan.zhihu.com/p/1918253363402867753)

# 不写代码，让 AI 生成手机 APP！保姆级教程

[![](https://profile-avatar.csdnimg.cn/bc29e3716a06479aa60afb84631b2234_weixin_31891047.jpg!1)](https://devpress.csdn.net/user/weixin_31891047)

### [克莱德电影院](https://devpress.csdn.net/user/weixin_31891047)

[134人浏览 · 2025-06-22 04:10:21](https://devpress.csdn.net/user/weixin_31891047)

[![](https://profile-avatar.csdnimg.cn/bc29e3716a06479aa60afb84631b2234_weixin_31891047.jpg!1)克莱德电影院](https://devpress.csdn.net/user/weixin_31891047) · 2025-06-22 04:10:21 发布

你现在看到的 APP，是我完全用 AI 生成的，一行代码都没写！怎么做到的呢？

![](https://i-blog.csdnimg.cn/img_convert/93390970ad46a138e3f3ade59b1fbf2a.png)

大家好，我是程序员鱼皮。AI 发展很快，现在随随便便就能生成一个网站，但是怎么纯用 AI 开发能在手机上运行的 APP 呢？网上基本上没有完整的教程。所以，我出手了，下面只用几分钟的时间，我会教大家如何利用 AI 生成 APP，依然是 **保姆级教程**。

⭐️ 本文对应视频，推荐观看：[https://bilibili.com/video/BV17HMcziEye](https://link.csdn.net/?target=https%3A%2F%2Fwww.bilibili.com%2Fvideo%2FBV17HMcziEye%2F)

下面有请我们的主角 `Cordova`！

### 一、什么是 Cordova？

Apache Cordova 是一个开源的移动应用开发框架，允许开发者使用 HTML、CSS 和 JavaScript 等 Web 技术开发 **跨平台** 的移动应用。它通过将 Web 技术封装在本地容器中，使得开发者可以编写一次代码，然后在 Android、iOS、Windows 等多个平台上运行。

![](https://i-blog.csdnimg.cn/img_convert/663ace5a0e96abd1d75a4cf5c730b8e5.png)

Cordova 主要基于以下几个核心组件实现，感兴趣的同学可以了解一下：

![](https://i-blog.csdnimg.cn/img_convert/0d0a9e8e223dbc3c8f9d5e2cc911d802.png)

也就是说，想要开发 APP，我们只需要把网站文件交给 Cordova，根据需要装一装插件、改一改配置，然后直接使用它提供的构建工具就能将 Web 应用打包成原生 APP 应用了（比如 APK 文件）！几乎不涉及任何代码编写和开发。

听起来很简单，有手就行？但是想使用 Cordova 开发 APP，必须要在电脑上安装对应的环境，比如 Android 和 IOS，而安装环境的难度可以说是 **非常炸裂** 了！

如果你自己折腾，可能至少要花个几天的时间，会踩很多坑，到网上搜各种方案还不一定能搞定。所以我才做了这个教程，该踩的坑我都帮大家踩完了，会 **用最短的时间带你搞定环境，并且教你如何使用 AI + Cordova 生成 APP**。开始之前记得 **点赞收藏三连** 哦，拜托，我的头发真的不多啦！

![](https://i-blog.csdnimg.cn/img_convert/ee9f9829a9c6201f9fc1d1372a808253.png)

### 二、环境准备

#### 安装 Cordova

首先我们要安装 Cordova。Cordova 的运行依赖 Node.js 和 NPM 前端工具，到 [Node.js 官网](https://link.csdn.net/?target=https%3A%2F%2Fnodejs.org%2Fzh-cn) 下载即可，会自动安装 NPM。

![](https://i-blog.csdnimg.cn/img_convert/b225b74da8e38900046db32ad752aba6.png)

可以把 NPM 理解为快速安装各种软件的小工具，安装完成后打开终端，执行下列命令安装 Cordova：

```cmake
npm install -g cordova复制
```

Cordova 支持将网站打包为 Android 和 IOS 移动端、Electron 桌面端应用。下面鱼皮带大家安装我个人认为难度最大的 **Android 环境**。注意，接下来的每一步，操作其实都不难，但是一定要仔细看！一个细节不注意可能就报错了！

#### 安装 Android 环境

首先，我们要根据 Cordova 的版本来确定所需环境和工具的版本，由于我们安装的 Cordova 是最新版本的，因此直接阅读 [最新的官方文档](https://link.csdn.net/?target=https%3A%2F%2Fcordova.apache.org%2Fdocs%2Fen%2Fdev%2Fguide%2Fplatforms%2Fandroid%2Findex.html) 即可，比如我这里需要的依赖如下：

![](https://i-blog.csdnimg.cn/img_convert/b73104b67df58ca67d634b4453368072.png)

其中，最重要的是：

- Java 17

- Gradle 8.13

- Android API 级别 >= 24


下面我们分别安装这些依赖。

##### 1、安装 Java

Java 版本必须是 17，最好找个现成的 [Windows 系统的 Java 安装包](https://link.csdn.net/?target=https%3A%2F%2Fwww.azul.com%2Fdownloads%2F%3Fversion%3Djava-17-lts%26os%3Dwindows%26package%3Djdk%23zulu)：

![](https://i-blog.csdnimg.cn/img_convert/f8b877a512a475f819b9f13c6830db00.png)

安装 Java 时建议选择 **自动配置环境变量**（包括 Path 和 JAVA\_HOME），就不用自己手动配置环境变量了。

![](https://i-blog.csdnimg.cn/img_convert/e9ec0676de9f6d798ba9ab065aa6220b.png)

安装完成后，打开终端执行 `java -version` 命令查看版本号，看到下列输出表示成功：

![](https://i-blog.csdnimg.cn/img_convert/88ef1f12fda1589a823ff4e4a477cd78.png)

如果无法执行命令，大概率是没有配置 Path 环境变量。

![](https://i-blog.csdnimg.cn/img_convert/07cf340565cd67966602510c075d0445.png)

##### 2、安装 Gradle

根据上面的版本号，Gradle 必须是 8.13，直接到 [官网](https://link.csdn.net/?target=https%3A%2F%2Fgradle.org%2Freleases%2F) 下载二进制压缩包即可。

![](https://i-blog.csdnimg.cn/img_convert/32b17dc86820b83cb3c39933ec0941db.png)

解压下载完成的压缩包，移动到 **不包含中文的路径** 中，然后配置环境变量，包括 Path 和 GRADLE\_HOME：

![](https://i-blog.csdnimg.cn/img_convert/e26078aa540da3183b15f9de0d5d53d6.png)

![](https://i-blog.csdnimg.cn/img_convert/707fa00341473d7f4845fad319d65ab1.png)

打开终端执行 `gradle -v` 命令，查看版本号：

![](https://i-blog.csdnimg.cn/img_convert/5288df7c4ba36e4836161707cc56b23b.png)

如果命令无法执行，大概率是 Path 环境变量配置错误。

##### 3、安装 Android

建议直接安装 Android 开发工具 [Android Studio](https://link.csdn.net/?target=https%3A%2F%2Fdeveloper.android.com%2Fstudio%3Fhl%3Dzh-cn)，会自动安装 Android 的开发 SDK 和运行环境。

到官网下载 Android studio，运行安装包，按照步骤安装即可：

![](https://i-blog.csdnimg.cn/img_convert/2432e81d1c87d98f7d34f6ed14559c9a.png)

安装完成后，第一次打开 Android Studio 时，会提醒你安装 Android SDK 环境：

![](https://i-blog.csdnimg.cn/img_convert/8ce4e7ce3827bee122baa1f3521fa4e8.png)

注意不要把 SDK 组件安装到包含中文的目录下，好在安装包也给了限制，不然又得栽倒一片人。。。

![](https://i-blog.csdnimg.cn/img_convert/f54c4c08f3ba69a1433a872bf7c70d0b.png)

接下来无脑安装即可，会自动安装各种 Android 开发常用的工具、还有安卓设备模拟器：

![](https://i-blog.csdnimg.cn/img_convert/33e0851ed6003042cbbeb19fbd1b5203.png)

这一步可能会有点煎熬，有些地区的朋友可能需要一些特殊的网络支持，你懂的。

![](https://i-blog.csdnimg.cn/img_convert/9e3740e305aaa1b51cbfb78cedcbced9.png)

![](https://i-blog.csdnimg.cn/img_convert/ee6d3d050c9abbd016f3aa2cd6954bd4.png)

经过了漫长的等待，Android SDK 终于安装完成，然后需要配置 Android 的环境变量 ANDROID\_HOME：

![](https://i-blog.csdnimg.cn/img_convert/08e3d5768de8e3bd05066e683937048e.png)

还要配置 platform-tools 到 Path 中，里面有一些命令行工具：

![](https://i-blog.csdnimg.cn/img_convert/39d50057668dc19447e25b3ee692f153.png)

配置完成后，我们打开 Android Studio，右上角进入 SDK Manager 的设置，根据 Cordova 的版本号要求，安装对应 API Level 的 SDK，比如我这里安装了 34 和 35 版本。

![](https://i-blog.csdnimg.cn/img_convert/be8d2ef6194e6c3b3919cb4e7d55d214.png)

这一步可能也会比较慢，耐心等待安装吧~

![](https://i-blog.csdnimg.cn/img_convert/90b8c99dcd6d0c75c6a5032d83a8fba8.png)

安装完 SDK 后，再进入 SDK 工具选项，安装 Command-line Tools 命令行工具，之后在电脑上运行安卓 apk 包时可能会用到：

![](https://i-blog.csdnimg.cn/img_convert/143b025457d23bc81331e27472399535.png)

同样，把 Command-line Tools 添加到环境变量 Path 中，路径为 `%ANDROID_HOME%\cmdline-tools\latest\bin`，这样一来，很多工具可以直接在终端中使用了，比如 apkanalyzer。

![](https://i-blog.csdnimg.cn/img_convert/53b4dce34ea91b93dcdfc1b1fcb45635.png)

##### 4、安装 Android 设备模拟器

下面我们要尝试在自己的电脑上运行 Android 手机模拟器，这样调试程序更方便。

打开 Android Studio 的设备管理器，添加一个新设备：

![](https://i-blog.csdnimg.cn/img_convert/67ba4a02c41a20b1ae767bfc06c864d3.png)

选择指定机型，建议选择 API 版本高一点的，我这里选择 Pixel 7：

![](https://i-blog.csdnimg.cn/img_convert/d24956d01d5927952a1213a25d6ca06c.png)

安装推荐的系统镜像：

![](https://i-blog.csdnimg.cn/img_convert/915aafff5e5238f7ed908797f4ba178f.png)

耐心等待后手机就创建成功了，直接运行：

![](https://i-blog.csdnimg.cn/img_convert/f470584e818365c252450e01ff3705ef.png)

结果，报错啦！

![](https://i-blog.csdnimg.cn/img_convert/4748d4fd2ce622b0ae96dc4781eed042.png)

如果你也遇到这种情况，可以在终端 **进入 Android 模拟器目录** 手动运行虚拟设备，这样能够看到详细的错误信息，有利于排查问题。

![](https://i-blog.csdnimg.cn/img_convert/62a4554d9ad2fbe72ceddeef32239183.png)

比如我这里显然是由于路径包含了中文！可恶啊，当时年少轻狂不自卑一个没注意用了中文路径。。。

![](https://i-blog.csdnimg.cn/img_convert/4ddfb1d749955e76e6693fd38e5445ff.png)

解决方法很简单，手动创建一个不包含中文路径的 avd 虚拟设备目录，然后设置环境变量 ANDROID\_SDK\_HOME：

![](https://i-blog.csdnimg.cn/img_convert/542c6606fe96828587860f238b4cafc1.png)

然后再利用 Android Studio 创建一个设备并运行，这次成功运行了，恭喜你多了一个手机！

![](https://i-blog.csdnimg.cn/img_convert/34c2ee34016714c25b38b5990c5250c5.png)

至此，环境终于搞定了，下面来实战 AI + Cordova 开发 APP。

### 三、AI + Cordova 实战

#### 创建项目

打开终端，进入你想要创建项目的目录，先执行 `cordova create` 命令来创建项目：

```xml
cordova create <你的项目英文名称>复制
```

首次创建项目可能会有提示：

![](https://i-blog.csdnimg.cn/img_convert/9de65cbb314e29a4730319c31e84a642.png)

#### 生成代码

此处有 2 种生成模式：

1. 先创建 Cordova 项目，然后在该项目内进行 AI 代码生成。告诉 AI 你要创建一个兼容 Cordova APP 的网站，直接让 AI 生成兼容 APP 的代码。这样做的好处是生成的代码 **可以使用 Cordova 插件调用系统原生的能力**，比如调用相机进行拍照。

2. 在 Cordova 项目外单独用 AI 生成网站项目，AI 不会关心你是否要把项目转为 Cordova APP，然后再把生成好的网站移动到 Cordova 项目中。这样做的好处是生成的网站代码更容易运行，同样 **适合你已经有现成网站项目** 的场景。


下面两种方式我都会给大家演示，先讲第一种模式，直接让 AI 生成一个【表情包生成器】的 Cordova APP。

用 Cursor 打开刚刚创建的 Cordova 项目目录，给 AI 输入下列提示词，提示词中需要包含 Cordova，并且提到 **兼容性**：

```clean
请帮我开发一个【移动端表情包生成器】Web APP，使用纯前端技术 + Cordova 实现。如果需要，你可以通过 Cordova 调用系统原生功能。​请生成完整的项目代码，确保功能完整可用，而且所有功能都需要同时兼容网页端和移动设备。​## 📋 功能需求### 1. 图片获取- 支持摄像头拍照- 支持从本地选择图片文件- 自动缩放图片到合适尺寸
        ​### 2. 表情包模板- 提供8-10个常用表情包模板（惊呆了、无语、赞、点赞、emo了等）- 网格布局展示模板，点击选择应用
           ​### 3. 文字编辑- 输入自定义文字内容- 调整字体大小（20px-50px）- 选择文字颜色（白色、黑色、红色等基础色彩）- 添加文字描边效果- 拖拽移动文字位置
                 ​### 4. 贴纸功能- 提供常用emoji表情贴纸（😂🤣😭😍🤔等5-10个）- 提供简单装饰贴纸（星星、爱心、箭头等）- 支持拖拽移动和简单缩放
                     ​### 5. 保存功能- 将编辑后的表情包导出为图片- 支持下载保存到本地
                        ​## 🎨 界面要求- 移动端优先：适配手机屏幕，大按钮设计- 页面布局：
                            - 主页：拍照按钮、选择图片按钮
                             - 编辑页：顶部工具栏 + 中央画布 + 底部功能区- 操作简单：实时预览效果，一键保存
                              ​## 📱 操作流程1. 拍照或选择图片2. 选择表情包模板3. 编辑文字内容和样式4. 添加emoji或装饰贴纸5. 预览效果并保存图片 复制
```

AI 生成的网站文件会放到 `www` 目录下。生成代码完成后，AI 可能会自动提醒你打包 APP 并且运行的命令，要依次添加安卓平台、安装插件、打包、运行。

![](https://i-blog.csdnimg.cn/img_convert/65f2b44ef8d60d18348c3eda0bff2c04.png)

这些命令我们等会儿就会用到，现在先不要自动执行，因为生成的代码不一定直接可用，我们需要先利用网页端进行调试。

#### 网页浏览

可以直接双击生成的 HTML 文件 `www/index.html` 查看效果；当然，更推荐的是通过 cordova 命令添加平台并运行。

先添加浏览器平台：

```livecodeserver
cordova platform add browser复制
```

如果你在执行命令时遇到了报错，可以直接问 AI，比如鱼皮遇到了缺少命令执行权限的错误：

![](https://i-blog.csdnimg.cn/img_convert/422cc9d8f6ace2ae97901bb513ee4c2b.png)

解决方案是，执行下列命令来修改 PowerShell 的执行策略：

```coq
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser复制
```

添加平台成功后，可以输入 `cordova run` 命令运行平台：

```routeros
cordova run browser复制
```

然后就能够查看到网站的运行效果了。需要注意的是，因为 Cordova Browser 平台的特殊性，通过这个命令运行的网页效果可能和直接双击、或者启动本地服务器运行有区别。

![](https://i-blog.csdnimg.cn/img_convert/7d12367626d1781813696cd14e9c8126.png)

除了上面的命令外，如果你想快速调试多个不同的平台，可以运行下列命令，统一查看各个平台：

```ada
cordova serve --port 8000复制
```

![](https://i-blog.csdnimg.cn/img_convert/de00aeeaa86e6ac5b05d8b1f4bd47ea1.png)

#### 添加安卓平台

接下来执行类似的命令来添加安卓平台：

```livecodeserver
cordova platform add android复制
```

如图，添加安卓平台成功，注意要 **确保输出的 Target SDK 和 Compile SDK 版本一致**：

![](https://i-blog.csdnimg.cn/img_convert/ee62e8c806b4bf6567ab8916de36cee6.png)

如果不一致，可能会影响 APP 的运行。可以修改 `config.xml` 的 targetSdkVersion 来修改版本号：

![](https://i-blog.csdnimg.cn/img_convert/67beb0a8939327d56032007eeb7ad285.png)

#### 添加插件

由于我的项目需要调用摄像头，所以要添加对应的插件，执行下列命令：

```processing
cordova plugin add cordova-plugin-camera复制
```

添加插件成功：

![](https://i-blog.csdnimg.cn/img_convert/9cb30639396d6bd7631607773ccf8e6f.png)

#### 打包运行安卓 APP

##### 打包

安装完插件后，执行 `cordova build` 命令可以打包 Android apk：

```ebnf
cordova build android复制
```

看到下列信息表示打包成功：

![](https://i-blog.csdnimg.cn/img_convert/98dbd8eef03dfbbd87e1e9aa45e5ebfe.png)

得到 apk 包后，有 2 种运行方式：

##### 手机运行

可以直接将 apk 包发送到手机安装运行：

![](https://i-blog.csdnimg.cn/img_convert/af7b5e160ce9eaea5a305cc06cbc93d0.png)

运行效果如图：

![](https://i-blog.csdnimg.cn/img_convert/1b47d86847d70ad633ec40d816183718.jpeg)

![](https://i-blog.csdnimg.cn/img_convert/8ab837cf213102f8fd552c54d31b08de.jpeg)

##### 电脑运行

先打开 Android Studio 并启动安卓虚拟设备，然后执行 `cordova run` 命令：

```routeros
cordova run android复制
```

就可以将 apk 安装到虚拟设备中，并且运行 APP 了，效果如图：

![](https://i-blog.csdnimg.cn/img_convert/5614c0a7c3f39739fabc0ba07914ebd0.png)

#### 常见报错

打包运行是最容易遇到报错的地方，可能会遇到很多种报错，比如缺少插件、缺少文件、无法安装依赖、无法运行等等，建议直接把报错信息发给 AI，让它帮你解决。

下面鱼皮分享一些自己遇到的坑点。

##### 1、项目缺少文件

比如鱼皮的项目缺少了图标文件：

![](https://i-blog.csdnimg.cn/img_convert/030a653f86f78cea440fa903e44bb732.png)

AI 尝试帮我创建图标：

![](https://i-blog.csdnimg.cn/img_convert/25f93a75ca927274eb2b902088823094.png)

或者简单粗暴，移除配置文件中对图标的引用：

![](https://i-blog.csdnimg.cn/img_convert/3db128e4dee97ec0734a0a9ce232d08e.png)

##### 2、缺少环境变量

如果环境搭建不顺利，可能会遇到下列报错，根据报错信息去进行对应的配置即可：

![](https://i-blog.csdnimg.cn/img_convert/461b34fcd9f36412eb5369b39d66cc71.png)

##### 3、命令执行失败

执行 `cordova run` 报错命令执行失败，可能是因为没有配置 `cmdline-tools` 到环境变量 Path 中。

![](https://i-blog.csdnimg.cn/img_convert/206265d407d65149c81a9d98aa5805d5.png)

##### 4、Gradle 无法安装

明明已经安装了 Gradle，但是 Cordova 仍然会安装 Gradle，而且可能因为网络原因下载失败：

![](https://i-blog.csdnimg.cn/img_convert/24658009ce07401fd908d2baf85b1007.png)

这时，我们可以配置环境变量 `CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL`，指定从本地下载 Gradle。环境变量的值设置为我们自己下载的 Gradle 压缩包的路径。

![](https://i-blog.csdnimg.cn/img_convert/b3ca4e6157649e89b8d25bc1b5b213dc.png)

如果修改配置后再次执行打包命令还是报错，建议删除项目内的 `platforms/android/.gradle` 缓存，然后重试。

### 四、已有项目打包为 APP

刚刚实战了直接用 AI 生成 Cordova APP 项目的方式，如果我们已经有现成的网站项目，也能够很方便地打包为 APP。

比如现在鱼皮有一个消消乐网页游戏项目，让我们来包装为 APP：

![](https://i-blog.csdnimg.cn/img_convert/a522f7f89bc36a2d170e59e48cd904e2.png)

1）先创建 cordova 项目：

```ebnf
cordova create yu-game-web-app复制
```

2）把已有的网页文件复制到 www 目录下：

![](https://i-blog.csdnimg.cn/img_convert/819f250a9bddba42f2bc624109fb2a61.png)

3）执行 cordova 命令添加 Android 平台：

```livecodeserver
cordova platform add android复制
```

4）最后，打包或者直接运行：

```routeros
cordova run android复制
```

运行成功的效果如图，还是很 nice 的~

![](https://i-blog.csdnimg.cn/img_convert/d938deac4ec90e802d303a5eb851f934.png)

### 最后

OK，教程到这里就结束了，由于缺少设备等原因，IOS 就先不给大家演示了。

最后给大家一些建议，Cordova 比较适合中小型网站项目，尤其适合已经有网站项目想快速转为 APP 的场景；但如果你需要搞一个复杂的大项目，依赖很多移动设备的原生能力，使用 Cordova 就不是很合适了，不如 Flutter。尤其是没有编程能力的同学来说，建议不要直接用 AI 生成复杂的 Cordova APP，很可能出现你搞不定的代码问题，但是做些小游戏、小工具还是很不错的。也希望我的分享对大家有帮助吧，想获取更多编程和 AI 干货的朋友记得关注鱼皮哦，拜拜~

### 更多编程学习资源

- [Java前端程序员必做项目实战教程+毕设网站](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fcourse)

- [程序员免费编程学习交流社区（自学必备）](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2F)

- [程序员保姆级求职写简历指南（找工作必备）](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fcourse%2Fcv)

- [程序员免费面试刷题网站工具（找工作必备）](https://link.csdn.net/?target=https%3A%2F%2Fwww.mianshiya.com%2F)

- [最新Java零基础入门学习路线 + Java教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640584449888772098)

- [最新Python零基础入门学习路线 + Python教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640586673306091521)

- [最新前端零基础入门学习路线 \+ 前端教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640586014108303362)

- [最新数据结构和算法零基础入门学习路线 \+ 算法教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640586867363954689)

- [最新C++零基础入门学习路线、C++教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1644279832026075138)

- [最新数据库零基础入门学习路线 \+ 数据库教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1641797333479903234)

- [最新Redis零基础入门学习路线 + Redis教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640589994284695553)

- [最新计算机基础入门学习路线 \+ 计算机基础教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1641035880439271426)

- [最新小程序入门学习路线 \+ 小程序开发教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1641366118197153793)

- [最新SQL零基础入门学习路线 + SQL教程](https://link.csdn.net/?target=http%3A%2F%2Fsqlmother.yupi.icu%2F)

- [最新Linux零基础入门学习路线 + Linux教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640586295529324545)

- [最新Git/GitHub零基础入门学习路线 + Git教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640588753362108417)

- [最新操作系统零基础入门学习路线 \+ 操作系统教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640587909942099969)

- [最新计算机网络零基础入门学习路线 \+ 计算机网络教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640588119619551233)

- [最新设计模式零基础入门学习路线 \+ 设计模式教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640588392073150465)

- [最新软件工程零基础入门学习路线 \+ 软件工程教程](https://link.csdn.net/?target=https%3A%2F%2Fwww.code-nav.cn%2Fpost%2F1640648711119892481)


原创作者: yupi 转载于: https://www.cnblogs.com/yupi/p/18932624

点击阅读全文


[![Logo](https://i-blog.csdnimg.cn/devpress/blog/43bee462002f45b0b76ef3e4ed98f51d.png)](https://openharmonycrossplatform.csdn.net/)

[开源鸿蒙跨平台开发者社区](https://openharmonycrossplatform.csdn.net/)

开源鸿蒙跨平台开发社区汇聚开发者与厂商，共建“一次开发，多端部署”的开源生态，致力于降低跨端开发门槛，推动万物智联创新。

加入社区


更多推荐

- ·
[HOA（鸿易通）黑科技开源神器HOA！安卓手机直接运行鸿蒙HAP应用 HOA是一个实验性项目，目标是在Android设备上直接运行OpenHarmony/HarmonyOS的HAP应用 它依靠ABI兼](https://openharmonycrossplatform.csdn.net/6a701bac662f9a54cb974955.html)
- ·
[王成录：机器人产业真正的卡脖子，不是硬件，是没有统一软件底座](https://openharmonycrossplatform.csdn.net/6a7009c410ee7a33f2957a66.html)
- ·
[AI时代前端何去何从？小白程序员必备的转型指南与收藏](https://openharmonycrossplatform.csdn.net/6a702eb6662f9a54cb974dc3.html)

[![cover](https://i-blog.csdnimg.cn/direct/36e1346ec21743c0a60a35c53df27bac.png)\\
\\
HOA（鸿易通）黑科技开源神器HOA！安卓手机直接运行鸿蒙HAP应用 HOA是一个实验性项目，目标是在Android设备上直接运行OpenHarmony/HarmonyOS的HAP应用 它依靠ABI兼](https://openharmonycrossplatform.csdn.net/6a701bac662f9a54cb974955.html)

[王成录：机器人产业真正的卡脖子，不是硬件，是没有统一软件底座\\
\\
目前国内机器人产业现状非常典型：硬件成本、结构设计、供应链能力都已经不输海外，各类无人车、机械臂、巡检机器人、人形设备层出不穷。基于OpenHarmony原生内核打造的M-Robots OS，从底层重构机器人运行逻辑：软硬实时混合内核解决工业控制稳定性，分布式软总线解决设备孤岛问题，M-DDS统一通信解决多机协同碎片化，积木式框架解决开发标准不统一。硬件厂商专注结构、算力、整机集成；标签：M-Ro](https://openharmonycrossplatform.csdn.net/6a7009c410ee7a33f2957a66.html)

[![cover](https://i-blog.csdnimg.cn/direct/eeb8b0dbd0a142b9aa4f68d7e4a4530e.png)\\
\\
AI时代前端何去何从？小白程序员必备的转型指南与收藏](https://openharmonycrossplatform.csdn.net/6a702eb6662f9a54cb974dc3.html)

- ![浏览量](https://csdnimg.cn/release/devpress/public/img/watch.a5bd9e9b.svg)134
- ![点赞](https://csdnimg.cn/release/devpress/public/img/thumb.a0b81433.svg)0
- ![收藏](https://csdnimg.cn/release/devpress/public/img/mark.f1a889ab.svg)0
- 0

### 所有评论(0)

您需要登录才能发言


## 温馨提示：您尚未绑定手机号

为遵守国家网络实名制规定，未绑定将限制内容发布与互动

[立即绑定](https://i.csdn.net/#/user-center/account)

[![](https://profile-avatar.csdnimg.cn/bc29e3716a06479aa60afb84631b2234_weixin_31891047.jpg!1)](https://devpress.csdn.net/user/weixin_31891047)

### [克莱德电影院](https://devpress.csdn.net/user/weixin_31891047)

[@weixin\_31891047](https://devpress.csdn.net/user/weixin_31891047)

关注

![](https://csdnimg.cn/release/devpress/public/img/devote.fe704c8a.svg)
已为社区贡献1条内容


热门标签

[![](https://csdnimg.cn/release/devpress/public/img/ic_editor_link_n@2x.f91f13fb.png)\\
Flutter](https://openharmonycrossplatform.csdn.net/column/6925934b907996281084d918)

[![](https://csdnimg.cn/release/devpress/public/img/ic_editor_link_n@2x.f91f13fb.png)\\
KMP](https://openharmonycrossplatform.csdn.net/column/69295b08907996281084d91c)

[![](https://csdnimg.cn/release/devpress/public/img/ic_editor_link_n@2x.f91f13fb.png)\\
CMP](https://openharmonycrossplatform.csdn.net/column/69295b1ac658121be9174fe7)

[![](https://csdnimg.cn/release/devpress/public/img/ic_editor_link_n@2x.f91f13fb.png)\\
React Native](https://openharmonycrossplatform.csdn.net/column/69295ada907996281084d91b)

框架专区

[Cordova](https://gitcode.com/openharmony-cordova?login=from_csdn) [React Native](https://gitcode.com/openharmony-sig/ohos_react_native/tree/master/docs/zh-cn#%E7%9B%AE%E5%BD%95?login=from_csdn) [Flutter](https://gitcode.com/openharmony-tpc/flutter_samples/tree/master/ohos/docs#%E6%96%87%E6%A1%A3%E5%85%A5%E5%8F%A3?login=from_csdn)

社区排行榜

全部

上个月

上周

昨日

1

[![](https://devpress.csdnimg.cn/3a68bac7b0c345a9825c0d360a05f323.jpeg)](https://devpress.csdn.net/user/qq_39132095)

坚果派

总声望值：15

2

[![](https://profile-avatar.csdnimg.cn/9bab908825414115b8160cc386a3c9ca_qq_42974034.jpg!1)](https://devpress.csdn.net/user/qq_42974034)

白马非马·

总声望值：5

3

[![](https://profile-avatar.csdnimg.cn/95445687a5a34547b8c1951fbedfc339_yanxinyun1990.jpg!1)](https://devpress.csdn.net/user/yanxinyun1990)

xiaoyan\_2018

总声望值：5

4

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/liuys_1212)

liuys\_1212

总声望值：5

5

[![](https://i-blog.csdnimg.cn/devpress/blog/df35c7a174ca4260b0c7ecee901b1c98.png)](https://devpress.csdn.net/user/qq_41651858)

渡°C

总声望值：4

6

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/newflashman)

newflashman

总声望值：4

7

[![](https://profile-avatar.csdnimg.cn/baf01cf6d4d649b094c4e4f9d0fd6f3d_lunring.jpg!1)](https://devpress.csdn.net/user/lunring)

lunring

总声望值：4

8

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/miroyhm)

solo

总声望值：4

9

[![](https://profile-avatar.csdnimg.cn/04af1e881a0b4f998c66dbede5a2e766_m0_74451345.jpg!1)](https://devpress.csdn.net/user/m0_74451345)

hid\_cpl23

总声望值：3

10

[![](https://profile-avatar.csdnimg.cn/c6bce4e3d0e14bbea1679129b00fae06_z_344791576.jpg!1)](https://devpress.csdn.net/user/z_344791576)

墨瑾轩

总声望值：3

11

[![](https://profile-avatar.csdnimg.cn/776a8b657e694198a7e472a628907c52_weixin_45822171.jpg!1)](https://devpress.csdn.net/user/weixin_45822171)

程序媛夏天

总声望值：3

12

[![](https://profile-avatar.csdnimg.cn/1bd87bf15e89439b8a3248f703100af7_fl1212.jpg!1)](https://devpress.csdn.net/user/fl1212)

企能WiseCRM365

总声望值：3

13

[![](https://profile-avatar.csdnimg.cn/0a33484a77f9492db30aaece77729ef5_qq_45549747.jpg!1)](https://devpress.csdn.net/user/qq_45549747)

即将拥有人鱼线的fxl

总声望值：3

14

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/m0_56765085)

m0\_56765085

总声望值：3

15

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2603_95818699)

2603\_95818699

总声望值：2

16

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2401_87095818)

2401\_87095818

总声望值：2

17

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/wyxxygth)

wyxxygth

总声望值：2

18

[![](https://profile-avatar.csdnimg.cn/ca36113fb3ff49cb8a7493cbb9b7f6ec_kilamiter.jpg!1)](https://devpress.csdn.net/user/kilamiter)

kilamiter

总声望值：2

19

[![](https://profile-avatar.csdnimg.cn/7384ab46c5a248219c7be0a214114984_weixin_37359162.jpg!1)](https://devpress.csdn.net/user/weixin_37359162)

Trafalgar\_LZH

总声望值：2

20

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2601_95869728)

2601\_95869728

总声望值：2

21

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/changcongcong_ios)

changcongcong\_ios

总声望值：2

22

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2302_77124405)

Turnsole

总声望值：2

23

[![](https://profile-avatar.csdnimg.cn/3219e7248ec14ba1a30616849f4cbfef_2401_88677290.jpg!1)](https://devpress.csdn.net/user/2401_88677290)

墨夶

总声望值：2

24

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/gameboy571)

gameboy571

总声望值：2

25

[![](https://i-avatar.csdnimg.cn/257ee43a179d400cb88d6853edb7b685_2402_89012204.jpg!1)](https://devpress.csdn.net/user/2402_89012204)

雪莉慕斯

总声望值：2

26

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2502_94338051)

不太会说话382

总声望值：2

27

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/Cuichenyang158)

可以叫我小崔

总声望值：2

28

[![](https://profile-avatar.csdnimg.cn/f9cf13684cac424e966b4fce2a5a2aa3_weixin_42440899.jpg!1)](https://devpress.csdn.net/user/weixin_42440899)

weixin\_42440899

总声望值：2

29

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2501_93554042)

2501\_93554042

总声望值：2

30

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/m0_57443669)

m0\_57443669

总声望值：2

31

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2401_88406498)

2401\_88406498

总声望值：2

32

[![](https://profile-avatar.csdnimg.cn/1ce7ecd345b440b0968d1f86354a5183_weixin_48325216.jpg!1)](https://devpress.csdn.net/user/weixin_48325216)

Charlieao

总声望值：2

33

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/this_is_0x7F)

this\_is\_0x7F

总声望值：2

34

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/m0_70059965)

m0\_70059965

总声望值：2

35

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/u011108920)

u011108920

总声望值：2

36

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/jywcdn)

jywcdn

总声望值：2

37

[![](https://profile-avatar.csdnimg.cn/e6b367c00be640a9bbe53a0b18c80311_weixin_73542031.jpg!1)](https://devpress.csdn.net/user/weixin_73542031)

linzi12344

总声望值：2

38

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2401_86348803)

2401\_86348803

总声望值：2

39

[![](https://profile-avatar.csdnimg.cn/98c0641f585945b48bca9e991e7fc2c8_qq_45653993.jpg!1)](https://devpress.csdn.net/user/qq_45653993)

qq\_45653993

总声望值：2

40

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2601_95256118)

2601\_95256118

总声望值：2

41

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2401_88512574)

2401\_88512574

总声望值：2

42

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/czj5210410)

czj5210410

总声望值：2

43

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2601_95132149)

2601\_95132149

总声望值：2

44

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2401_82544093)

2401\_82544093

总声望值：2

45

[![](https://profile-avatar.csdnimg.cn/57929dd33be745f0ae0d6751f510f30e_weixin_45867397.jpg!1)](https://devpress.csdn.net/user/weixin_45867397)

来深圳

总声望值：2

46

[![](https://profile-avatar.csdnimg.cn/fa34f4e6adae498aba2d0bedbd6271b3_weixin_46115383.jpg!1)](https://devpress.csdn.net/user/weixin_46115383)

weixin\_46115383

总声望值：2

47

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/Yzjlg)

Yzjlg

总声望值：2

48

[![](https://profile-avatar.csdnimg.cn/43cf6c18c1d04aceb53780e3683958bd_weixin_53907902.jpg!1)](https://devpress.csdn.net/user/weixin_53907902)

weixin\_53907902

总声望值：2

49

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/lieyanfeiniao_)

lieyanfeiniao\_

总声望值：2

50

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2403_89689706)

何日人间重逢820

总声望值：2

51

[![](https://profile-avatar.csdnimg.cn/700c03784f7a44339c33687c2b6d9d5b_ofuufo.jpg!1)](https://devpress.csdn.net/user/OFUUFO)

不良井码农

总声望值：2

52

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/weixin_40205817)

施洋

总声望值：2

53

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/shinji3887)

shinji3887

总声望值：2

54

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/philos1668)

philos1668

总声望值：2

55

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/weixin_38342866)

开飞机的小蚂蚁

总声望值：2

56

[![](https://profile-avatar.csdnimg.cn/a71c82392eec426b94f98483fba11548_keyi_lanyu.jpg!1)](https://devpress.csdn.net/user/keyi_lanyu)

keyi\_lanyu

总声望值：2

57

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2501_90869996)

赵英豪学习编程

总声望值：2

58

[![](https://profile-avatar.csdnimg.cn/b0b00f9bcc694c7f8f0deec118e0e083_weixin_50485656.jpg!1)](https://devpress.csdn.net/user/weixin_50485656)

weixin\_50485656

总声望值：2

59

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/u011277761)

lvan930618

总声望值：2

60

[![](https://profile-avatar.csdnimg.cn/eb59073c6a2f4c2bbd4eef10daf3979a_huangtians.jpg!1)](https://devpress.csdn.net/user/huangtians)

RichardHuang87

总声望值：2

61

[![](https://devpress.csdnimg.cn/5a37b762011846ac87df6f5977d5ec68.png)](https://devpress.csdn.net/user/hl807092862)

小熊代码屋

总声望值：2

62

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2501_94719450)

2501\_94719450

总声望值：2

63

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/Alpaca10086zyys)

Alpaca10086zyys

总声望值：2

64

[![](https://profile-avatar.csdnimg.cn/558aafe1778c4c50b45fbc1542b82fbe_qq_31532979.jpg!1)](https://devpress.csdn.net/user/qq_31532979)

数据科学与艺术

总声望值：2

65

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/tsusus)

JS逆向工程师

总声望值：2

66

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/qq_41875447)

qq\_41875447

总声望值：2

67

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/m0_74430584)

m0\_74430584

总声望值：2

68

[![](https://profile-avatar.csdnimg.cn/616732c7bcff4f2c8abb261e89fb3bdd_qiaomu8559968.jpg!1)](https://devpress.csdn.net/user/qiaomu8559968)

不羁的木木

总声望值：2

69

[![](https://profile-avatar.csdnimg.cn/f635e00ec88a4a9f8d0a0761002f014d_weixin_43444859.jpg!1)](https://devpress.csdn.net/user/weixin_43444859)

X H \`

总声望值：2

70

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/duweikang2023)

杜同学

总声望值：2

71

[![](https://profile-avatar.csdnimg.cn/19beb5395db54f3bbcb9a3d37b57c587_2401_82544706.jpg!1)](https://devpress.csdn.net/user/2401_82544706)

Yy\_zhen

总声望值：2

72

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2601_95097083)

2601\_95097083

总声望值：2

73

[![](https://profile-avatar.csdnimg.cn/17ac2a5e8c6e411e9aae3416c9b6a480_qq_39459933.jpg!1)](https://devpress.csdn.net/user/qq_39459933)

心雨无晴

总声望值：2

74

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/Warmy_)

Warmy\_

总声望值：2

75

[![](https://profile-avatar.csdnimg.cn/ca8adb62d42946ad86c370e124d7dca8_weixin_45995246.jpg!1)](https://devpress.csdn.net/user/weixin_45995246)

weixin\_45995246

总声望值：2

76

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2403_89780898)

℃伊伊伊笑

总声望值：2

77

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/Py1475620)

Py1475620

总声望值：2

78

[![](https://profile-avatar.csdnimg.cn/aa1ee17be7d54619bb94be5658647e9b_weixin_43370155.jpg!1)](https://devpress.csdn.net/user/weixin_43370155)

CSDN产品汪

总声望值：2

79

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/guanmingyuangmy)

Frame Not Work

总声望值：2

80

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/ExplorerX7)

ExplorerX7

总声望值：2

81

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/ERIC_YYT)

ERIC\_YYT

总声望值：2

82

[![](https://profile-avatar.csdnimg.cn/ba54604651254dc3a898124307a1ec06_qq_48974566.jpg!1)](https://devpress.csdn.net/user/qq_48974566)

秃头王✾

总声望值：2

83

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/weixin_40810494)

weixin\_40810494

总声望值：2

84

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/wwyc153)

wwyc153

总声望值：2

85

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2600_95233517)

2600\_95233517

总声望值：2

86

[![](https://devpress.csdnimg.cn/5a37b762011846ac87df6f5977d5ec68.png)](https://devpress.csdn.net/user/k1ren)

k1ren

总声望值：2

87

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/u013279985)

小淘气123

总声望值：2

88

[![](https://profile-avatar.csdnimg.cn/f0db67b9cdb541918a87e86837901c4d_weixin_46087804.jpg!1)](https://devpress.csdn.net/user/weixin_46087804)

一叶迎秋

总声望值：2

89

[![](https://profile-avatar.csdnimg.cn/0e43b4816c6b4382ac05b43b1f1c98ad_qq8864.jpg!1)](https://devpress.csdn.net/user/qq8864)

特立独行的猫a

总声望值：2

90

[![](https://devpress.csdnimg.cn/5a37b762011846ac87df6f5977d5ec68.png)](https://devpress.csdn.net/user/hao1208hao)

hao1208hao

总声望值：2

91

[![](https://profile-avatar.csdnimg.cn/501f4f2f7878468da6bff5810e50b834_wangshan_api.jpg!1)](https://devpress.csdn.net/user/wangshan_api)

wangshan\_aqi

总声望值：2

92

[![](https://profile-avatar.csdnimg.cn/5d5d23c961d048138d8320e20602d1d7_qq_42381823.jpg!1)](https://devpress.csdn.net/user/qq_42381823)

仰望星空啊

总声望值：2

93

[![](https://profile-avatar.csdnimg.cn/b7c699b7956d4bb689b2b150fdcdc6e5_2403_84993152.jpg!1)](https://devpress.csdn.net/user/2403_84993152)

wumingtao697

总声望值：2

94

[![](https://profile-avatar.csdnimg.cn/default.jpg!1)](https://devpress.csdn.net/user/2601_95005578)

2601\_95005578

总声望值：2

目录

- [一、什么是 Cordova？](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html#devmenu1)
- [二、环境准备](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html#devmenu2)
- [三、AI + Cordova 实战](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html#devmenu3)
- [四、已有项目打包为 APP](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html#devmenu4)
- [最后](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html#devmenu5)
- [更多编程学习资源](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html#devmenu6)

![](https://csdnimg.cn/release/devpress/public/img/top.c3a2945a.svg)

回到

顶部

![](https://i-blog.csdnimg.cn/devpress/blog/43bee462002f45b0b76ef3e4ed98f51d.png)开源鸿蒙跨平台开发者社区

[首页](https://openharmonycrossplatform.csdn.net/)

[框架专区](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html)

[技术专栏](https://openharmonycrossplatform.csdn.net/6940dcfc0800f3458b8319a5.html)

[社区活动](https://openharmonycrossplatform.csdn.net/column/692572e688b0851a8f833b48) [讨论广场](https://openharmonycrossplatform.csdn.net/user/discuss)

## 登录社区云

登录社区云，与社区用户共同成长

- CSDN账号登录

欢迎加入社区

取消确定

### 开源鸿蒙跨平台开发者社区

邀请您加入社区

立即加入

欢迎加入社区

取消确定

欢迎加入社区

取消确定

欢迎加入社区

取消确定