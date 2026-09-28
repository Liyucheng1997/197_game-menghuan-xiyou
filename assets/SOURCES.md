# 公开素材来源

获取日期：2026-09-10。用途：本项目本地测试。游戏素材版权属于网易及相应权利人；官网提供下载不等于授予任意再发行许可。未下载客户端、私服包或执行第三方程序，未修改原始图片和音频。

v2.0 起，角色、怪物、NPC、地图、界面与技能特效全部由程序实时绘制（Q 版风格），不再使用官网场景图、角色 GIF 和宣传立绘；这些文件已从仓库移除（可在 v1.1 的 git 历史中找到）。目前仅保留以下素材：

| 本地文件 | 来源页面 / 下载包 | 包内文件或下载地址 | 使用方式 |
|---|---|---|---|
| ui/logo.png | [官网素材下载](https://xyq.163.com/download/sucai.html) | [logo.7z](https://xyq.res.netease.com/download/sucai/logo.7z) → logo/梦幻西游电脑版Logo.png | 标题页标志 |
| music/changan.mp3 | [官网原声音乐下载](https://xyq.163.com/download/down_music.html) | [CA.mp3](https://xyq.res.netease.com/music/city/CA.mp3) | 长安城、门派场景 |
| music/jianye.mp3 | 同上 | [JY.mp3](https://xyq.res.netease.com/music/city/JY.mp3) | 建邺城 |
| music/donghai.mp3 | 同上 | [DHW.mp3](https://xyq.res.netease.com/music/lian/DHW.mp3) | 东海湾、沉船 |
| music/jiaowai.mp3 | 同上 | [JNYW.mp3](https://xyq.res.netease.com/music/lian/JNYW.mp3) | 江南野外、大唐国境、花果山 |
| music/battle.mp3 | 同上 | [fight1.mp3](https://xyq.res.netease.com/music/fight/fight1.mp3) | 战斗 |
| music/title.mp3 | 同上 | [CSJW.mp3](https://xyq.res.netease.com/music/lian/CSJW.mp3) | 标题页、大唐境外、白骨洞 |

操作音效由 WebAudio 实时合成。`inventory.json` 记录上述本地文件的大小与 SHA-256，供替换和校验。
